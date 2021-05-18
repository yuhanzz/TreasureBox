from flask import Flask, render_template, request, redirect, url_for
from flask import Response, send_file

app = Flask(__name__)

import sql as db

@app.route('/')

def index():
    return render_template("login.html")


@app.route('/register')
def new_user():
    return render_template("register.html")
#
# @app.route('/profile')
# def profile():
#     return render_template("profile.html")

@app.route('/insert', methods=['post'])
def insert():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        firstname = request.form['firstname']
        lastname = request.form['lastname']
        gender = request.form['gender']
        age = request.form['age']
        db.insert_users(username, password, firstname, lastname, gender, age)
        # details = db.get_users()
        # print(details)
        # for detail in details:
        #     var = detail
        #     return render_template('register.html', var=var)
        #
        return render_template("login.html")

@app.route('/checkuser', methods=['post'])
def checkuser():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        result = db.check_user(username, password)
        if result == 0:
            userId = username;
            return render_template("mainpage.html", value = userId)
        else:
            return render_template("loginfail.html")

if __name__ == '__main__':
    app.run(debug=True)