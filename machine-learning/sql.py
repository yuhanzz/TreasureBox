import pymysql

def get_user(user_id):
    conn = pymysql.connect(
        host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
        port = 3306,
        user = "admin",
        password = "Zj19660412!",
        db = "cloudComputing",
    )
    cur=conn.cursor()
    cur.execute("SELECT * FROM Users WHERE username=%s",user_id)
    users = cur.fetchall()
    cur.close()
    conn.close()
    return users[0]

