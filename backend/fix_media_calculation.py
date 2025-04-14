import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Função para estabelecer conexão com o banco de dados
def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "gestaoescolar"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        port=os.getenv("DB_PORT", "5432")
    )
    conn.autocommit = False
    return conn

def recalcular_media(nota_mensal, nota_bimestral, recuperacao):
    """
    Recalcula a média usando a fórmula correta:
    - Média = (mensal + bimestral) / 2
    - Se tem recuperação, média final = (média + recuperação) / 2
    """
    # Tratar valores None como 0
    nota_mensal = 0 if nota_mensal is None else float(nota_mensal)
    nota_bimestral = 0 if nota_bimestral is None else float(nota_bimestral)
    
    # Calcular média inicial entre mensal e bimestral
    if nota_mensal > 0 or nota_bimestral > 0:
        if nota_mensal > 0 and nota_bimestral > 0:
            media = (nota_mensal + nota_bimestral) / 2
        elif nota_mensal > 0:
            media = nota_mensal
        else:
            media = nota_bimestral
        
        # Se tem recuperação, calcular média final
        if recuperacao is not None and float(recuperacao) > 0:
            media = (media + float(recuperacao)) / 2
        
        return round(media, 1)
    
    return 0.0

def corrigir_media_notas():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Buscar todas as notas do banco
        cursor.execute("""
            SELECT id, nota_mensal, nota_bimestral, recuperacao, media
            FROM nota
        """)
        
        notas = cursor.fetchall()
        total_alteradas = 0
        
        print(f"Total de notas encontradas: {len(notas)}")
        
        # Para cada nota, recalcular a média e atualizar se necessário
        for nota in notas:
            id_nota, nota_mensal, nota_bimestral, recuperacao, media_atual = nota
            
            # Calcular a média correta
            nova_media = recalcular_media(nota_mensal, nota_bimestral, recuperacao)
            
            # Se a média calculada for diferente da armazenada, atualizar
            if abs(float(media_atual or 0) - nova_media) > 0.001:  # Usar tolerância para comparação de float
                print(f"Atualizando nota ID {id_nota}:")
                print(f"  Mensal: {nota_mensal}, Bimestral: {nota_bimestral}, Recuperação: {recuperacao}")
                print(f"  Média antiga: {media_atual}, Média nova: {nova_media}")
                
                cursor.execute("""
                    UPDATE nota
                    SET media = %s
                    WHERE id = %s
                """, (nova_media, id_nota))
                
                total_alteradas += 1
        
        # Commit das alterações
        conn.commit()
        print(f"\nTotal de notas corrigidas: {total_alteradas}")
        
    except Exception as e:
        conn.rollback()
        print(f"Erro ao corrigir médias: {str(e)}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("Iniciando correção das médias das notas...")
    corrigir_media_notas()
    print("Processo concluído!") 