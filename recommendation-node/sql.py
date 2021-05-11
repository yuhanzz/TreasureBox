import pymysql

conn = pymysql.connect(
    host = "cc-instance.c75aookn21ch.us-east-2.rds.amazonaws.com",
    port = 3306,
    user = "admin",
    password = "Zj19660412!",
    db = "cloudComputing",
)
#Table Creation
cursor=conn.cursor()


def get_user(user_id):
    cur=conn.cursor()
    cur.execute("SELECT * FROM Users WHERE username=%s",user_id)
    users = cur.fetchall()
    return users[0]


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
