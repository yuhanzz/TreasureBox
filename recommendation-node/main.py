from flask import Flask, render_template, request, redirect, url_for
from flask import Response, send_file

app = Flask(__name__)

import sql as db
import recommend as rc

@app.route('/recommendation', methods=['post'])
def evaluate():
    if request.method == 'POST':
        user_id = request.form['user_id']
        item = request.form['data']
        user = db.get_user(user_id)
        X, items = rc.preprocess(item,user)
        recommend_list = rc.get_recommendation(X,"pretrained_model.pkl",items,5)
        return recommend_list

if __name__ == '__main__':
    app.run(debug=True)
