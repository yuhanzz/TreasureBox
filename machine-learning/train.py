from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pandas as pd
import joblib
import os
import argparse

categ = np.array(['C','S','H','E','B'])#['Clothing','Shoes','Handbags','Electronics','Books']
d = {'0women1':[(0.5,50),(0.2,50),(0.05,50),(0.15,500),(0.1,30)],
     '0women2':[(0.45,150),(0.25,150),(0.15,200),(0.1,900),(0.05,30)],
     '0women3':[(0.3,50),(0.3,50),(0.2,100),(0.1,500),(0.1,30)],
     '1men1':[(0.1,50),(0.5,100),(0.01,50),(0.3,500),(0.09,30)],
     '1men2':[(0.1,100),(0.35,150),(0.01,50),(0.5,900),(0.04,30)],
     '1men3':[(0.1,50),(0.35,50),(0.05,50),(0.3,500),(0.2,30)]}


def make_data(num):
    data = {'gender':[],'age':[],'category':[], 'price':[]}
    age = {'1':(10,25),'2':(25,50),'3':(50,70)}
    purchased = []
    for k in d:
        for i in range(len(categ)):
            c = d[k][i]
            N = int(num*c[0])
            nn = (num-N)//2
            data['gender']+=([int(k[0])]*2*(nn+N))
            data['category']+=([categ[i]]*2*(nn+N))
            purchased+=([1]*2*N)
            data['age']+=list(np.random.randint(age[k[-1]][0],age[k[-1]][1], size=2*N))
            data['price']+= list(np.random.randint(c[1]*0.5,c[1]*1.5, size=2*N))
            purchased+=([0]*2*nn)
            data['age']+=list(np.random.randint(age[k[-1]][0],age[k[-1]][1], size=2*nn))
            data['price']+= list(np.random.randint(1,c[1]*0.4, size=nn))
            data['price']+= list(np.random.randint(c[1]*1.6,c[1]*3, size=nn))

    df = pd.DataFrame.from_dict(data)
    df = pd.get_dummies(df)
    return df,purchased

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output-data-dir', type=str, default=os.environ['SM_OUTPUT_DATA_DIR'])
    parser.add_argument('--model-dir', type=str, default=os.environ['SM_MODEL_DIR'])
    args = parser.parse_args()

    train_X, train_y = make_data(100)
    clf = RandomForestClassifier(max_depth=5, n_estimators=200).fit(train_X, train_y) 
    joblib.dump(clf, os.path.join(args.model_dir, "model.joblib"))

def model_fn(model_dir):
    """Deserialized and return fitted model

    Note that this should have the same name as the serialized model in the main method
    """
    clf = joblib.load(os.path.join(model_dir, "model.joblib"))
    return clf

def predict_fn(input_data, model):
    pred_prob = model.predict_proba(input_data)
    return pred_prob