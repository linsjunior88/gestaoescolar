import os
import psycopg2
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def get_db_connection():
    """Estabelece conexão com o banco de dados"""
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "gestaoescolar"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
        port=os.getenv("DB_PORT", "5432")
    )
    conn.autocommit = False
    return conn

def executar_script_sql(arquivo):
    """Executa um arquivo SQL no banco de dados"""
    print(f"Executando script SQL: {arquivo}")
    
    try:
        # Ler o conteúdo do arquivo SQL
        with open(arquivo, 'r') as file:
            sql_script = file.read()
        
        # Conectar ao banco de dados
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Executar o script
        cursor.execute(sql_script)
        
        # Commit das alterações
        conn.commit()
        print(f"Script SQL executado com sucesso!")
        
        # Fechar conexão
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Erro ao executar script SQL: {str(e)}")
        return False

def executar_correcao_python():
    """Executa o script Python de correção de médias"""
    print("Executando script Python de correção de médias...")
    
    try:
        # Importar e executar a função de correção
        from fix_media_calculation import corrigir_media_notas
        corrigir_media_notas()
        
        print("Script Python executado com sucesso!")
        return True
    except Exception as e:
        print(f"Erro ao executar script Python: {str(e)}")
        return False

def verificar_correcao():
    """Verifica se todas as médias estão corretas após a correção"""
    print("Verificando correção das médias...")
    
    try:
        # Conectar ao banco de dados
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Consultar notas incorretas (usando a mesma lógica do cálculo correto)
        cursor.execute("""
            SELECT id, nota_mensal, nota_bimestral, recuperacao, media,
                CASE 
                    WHEN nota_mensal IS NOT NULL AND nota_bimestral IS NOT NULL THEN
                        CASE 
                            WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                                ROUND(((nota_mensal + nota_bimestral) / 2 + recuperacao) / 2, 1)
                            ELSE
                                ROUND((nota_mensal + nota_bimestral) / 2, 1)
                        END
                    WHEN nota_mensal IS NOT NULL THEN
                        CASE 
                            WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                                ROUND((nota_mensal + recuperacao) / 2, 1)
                            ELSE
                                nota_mensal
                        END
                    WHEN nota_bimestral IS NOT NULL THEN
                        CASE 
                            WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                                ROUND((nota_bimestral + recuperacao) / 2, 1)
                            ELSE
                                nota_bimestral
                        END
                    ELSE
                        0
                END AS media_correta
            FROM nota
            WHERE
                CASE 
                    WHEN nota_mensal IS NOT NULL AND nota_bimestral IS NOT NULL THEN
                        CASE 
                            WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                                ROUND(((nota_mensal + nota_bimestral) / 2 + recuperacao) / 2, 1)
                            ELSE
                                ROUND((nota_mensal + nota_bimestral) / 2, 1)
                        END
                    WHEN nota_mensal IS NOT NULL THEN
                        CASE 
                            WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                                ROUND((nota_mensal + recuperacao) / 2, 1)
                            ELSE
                                nota_mensal
                        END
                    WHEN nota_bimestral IS NOT NULL THEN
                        CASE 
                            WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                                ROUND((nota_bimestral + recuperacao) / 2, 1)
                            ELSE
                                nota_bimestral
                        END
                    ELSE
                        0
                END <> media
        """)
        
        notas_incorretas = cursor.fetchall()
        
        if not notas_incorretas:
            print("Todas as médias estão corretas!")
        else:
            print(f"Ainda existem {len(notas_incorretas)} médias incorretas:")
            for nota in notas_incorretas:
                print(f"ID: {nota[0]}, Mensal: {nota[1]}, Bimestral: {nota[2]}, Recuperação: {nota[3]}")
                print(f"Média atual: {nota[4]}, Média correta: {nota[5]}")
        
        cursor.close()
        conn.close()
        
        return len(notas_incorretas) == 0
    except Exception as e:
        print(f"Erro ao verificar correção: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== INICIANDO CORREÇÃO DO CÁLCULO DE MÉDIAS ===")
    
    # Etapa 1: Executar script SQL para criar trigger e atualizar médias
    sql_sucesso = executar_script_sql('update_media_calculation.sql')
    
    # Etapa 2: Executar script Python para garantir que todas as médias estão atualizadas
    if sql_sucesso:
        python_sucesso = executar_correcao_python()
    else:
        python_sucesso = False
        print("Pulando execução do script Python devido a falha no SQL.")
    
    # Etapa 3: Verificar se todas as médias estão corretas
    if sql_sucesso and python_sucesso:
        verificacao_sucesso = verificar_correcao()
    else:
        verificacao_sucesso = False
        print("Pulando verificação devido a falhas anteriores.")
    
    # Resultado final
    if sql_sucesso and python_sucesso and verificacao_sucesso:
        print("\n=== CORREÇÃO DE MÉDIAS CONCLUÍDA COM SUCESSO! ===")
        print("Todas as médias foram corrigidas e o cálculo foi atualizado.")
    else:
        print("\n=== CORREÇÃO DE MÉDIAS CONCLUÍDA COM ALERTAS! ===")
        print("Verifique os erros reportados acima e tente novamente.")
    
    print("\nPróximos passos:")
    print("1. Reinicie o servidor da API para aplicar as mudanças")
    print("2. Teste o sistema para garantir que as médias estão sendo calculadas corretamente") 