import os
import io
import boto3
import json
import csv
import pandas as pd
import numpy as np
import pymysql
# grab environment variables
ENDPOINT_NAME = 'sagemaker-scikit-learn-2021-05-20-23-14-54-193'
runtime= boto3.client('runtime.sagemaker')

def lambda_handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))
    data = json.loads(json.dumps(event))
    user_id = data['username']
    item = data['data']
    if len(item)==0:
        return {"recommend": []}
    conn = pymysql.connect(
        host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
        port = 3306,
        user = "admin",
        password = "Zj19660412!",
        db = "cloudComputing",
    )
    cur=conn.cursor()
    cur.execute("SELECT * FROM Users WHERE username=%s",user_id)
    user = cur.fetchall()[0]
    cur.close()
    conn.close()
    items, categories, prices = [], [], []
    
    for i in item:
        items.append(i['_id'])
        categories.append(i['category'])
        prices.append(i['price']*int(2779))
    X = pd.DataFrame(columns=['gender', 'age', 'price', 'category_B', 'category_C', 'category_E',
       'category_H', 'category_S'])
    X['price'] = prices
    emp = np.zeros(len(items),int)
    X['category_B'],X['category_C'],X['category_E'],X['category_H'],X['category_S'] = emp,emp,emp,emp,emp
    for i in range(len(categories)):
        X['category_'+categories[i][0].upper()].iloc[i] = 1
    gender = 1 if user[-2].lower()=='male' else 0
    age = int(user[-1])
    X['gender'] = [gender]*len(items)
    X['age'] = [age]*len(items)
    
    items = np.array(items)
    
    response = runtime.invoke_endpoint(EndpointName=ENDPOINT_NAME,
                                       ContentType='text/csv',
                                       Body=X.to_csv(header=False, index=False).encode("utf-8"))

    result = json.loads(response['Body'].read().decode())
    pred = np.array(result)[:,1]
    k = len(items)
    if len(items)>10:
        k=10
    reco = {"recommend":list(items[np.argsort(pred)[::-1]][:k])}
    return reco