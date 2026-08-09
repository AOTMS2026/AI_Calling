import psycopg
DB_URL = "postgresql://neondb_owner:npg_NTJ9lv6cZuiL@ep-muddy-bonus-ayb4w3ar.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
conn = psycopg.connect(DB_URL)
cursor = conn.cursor()
cursor.execute("SELECT id, allocated_credits FROM \"user\" WHERE email='ramanadhamjayaveer@gmail.com'")
user = cursor.fetchone()
print("User:", user)
if user:
    cursor.execute("SELECT total_cost FROM user_metrics WHERE user_id=%s", (user[0],))
    metric = cursor.fetchone()
    print("Metrics:", metric)
