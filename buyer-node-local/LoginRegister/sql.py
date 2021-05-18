import pymysql

def insert_users(username, password, firstname, lastname, gender, age):
    conn = pymysql.connect(
        host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
        port = 3306,
        user = "admin",
        password = "Zj19660412!",
        db = "cloudComputing",
    )
    cur=conn.cursor()
    cur.execute("INSERT INTO Users(username, password, firstname, lastname, gender, age) VALUES(%s, %s, %s, %s, %s, %s)", (username, password, firstname, lastname, gender, age))
    conn.commit()
    cur.close()
    conn.close()

def get_users():
    conn = pymysql.connect(
        host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
        port = 3306,
        user = "admin",
        password = "Zj19660412!",
        db = "cloudComputing",
    )
    cur=conn.cursor()
    cur.execute("SELECT * FROM Users")
    users = cur.fetchall()
    cur.close()
    conn.close()
    return users

def check_user(username, password):
    conn = pymysql.connect(
        host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
        port = 3306,
        user = "admin",
        password = "Zj19660412!",
        db = "cloudComputing",
    )
    cur=conn.cursor()
    cur.execute("SELECT * FROM Users WHERE username=%s AND password=%s", (username, password))
    result = cur.fetchall()
    cur.close()
    conn.close()
    if len(result) == 0:
        return 1
    else:
        return 0

if __name__ == "__main__":
    conn = pymysql.connect(
        host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
        port = 3306,
        user = "admin",
        password = "Zj19660412!",
        db = "cloudComputing",
    )
    #Table Creation
    cursor=conn.cursor()
    create_table="""
    create table Users (username varchar(200), password varchar(200), firstname varchar(200), lastname varchar(200), gender varchar(200), age varchar(200))
    """

    cursor.execute(create_table)
