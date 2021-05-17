from flask import Flask, render_template, request, redirect, url_for,jsonify
from flask import Response, send_file

app = Flask(__name__)

import sql as db
import recommend as rc

@app.route('/recommendation', methods=['POST'])
def evaluate():
    if request.method == 'POST':
        user_id = request.json['username']
        item = request.json['data']
        user = db.get_user(user_id)
        X, items = rc.preprocess(item,user)
        recommend_list = rc.get_recommendation(X,"pretrained_model.pkl",items,5)
        return jsonify({"recommend":list(recommend_list)})

if __name__ == '__main__':
    app.run(debug=True,port=9090)
