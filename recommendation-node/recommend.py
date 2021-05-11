from sklearn.linear_model import LogisticRegression
import numpy as np
import pandas as pd
import pickle

def preprocess(item,user):
    items, categories, prices = [], [], []
    for i in json:
        items.append(i['_id'])
        categories.append(i['category'])
        prices.append(i['price'])
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
    return X, np.array(items)

def get_recommendation(X,pkl_filename,items,k):
    with open(pkl_filename, 'rb') as file:
        clf = pickle.load(file)
    pred = clf.predict_proba(X)[:,1]
    print(pred)
    return items[np.argsort(pred)[::-1][:k]]
	
