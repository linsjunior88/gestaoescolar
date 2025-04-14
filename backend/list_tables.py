import psycopg2

def list_tables():
    """
    List all tables in the database
    """
    try:
        # Connect to the database
        conn = psycopg2.connect(
            dbname="gestao_escolar",
            user="postgres",
            password="4chrOn0s@",
            host="localhost",
            port="5432"
        )
        
        # Create a cursor
        cursor = conn.cursor()
        
        # Query to get all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        # Fetch all results
        tables = cursor.fetchall()
        
        print("Tables in the database:")
        for table in tables:
            print(f"- {table[0]}")
        
        # Close cursor and connection
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"Error listing tables: {e}")
        return False

if __name__ == "__main__":
    list_tables() 