import os
import json
import yaml

def build_portfolio():
    projects_dir = 'projects'  # Diretório onde estão seus arquivos Markdown
    output_dir = 'dist'        # Diretório de saída para os arquivos estáticos e o JSON
    output_json_file = os.path.join(output_dir, 'projects.json')

    portfolio_data = []

    # Garante que o diretório de saída exista
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(projects_dir):
        print(f"Erro: O diretório '{projects_dir}' não foi encontrado.")
        return

    # Percorre todos os arquivos no diretório 'projects'
    for filename in os.listdir(projects_dir):
        if filename.endswith('.md'):
            filepath = os.path.join(projects_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

                # Extrai o YAML front matter
                # O front matter é delimitado por '---' no início e no fim
                if content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) > 2:
                        yaml_str = parts[1].strip()
                        try:
                            project_info = yaml.safe_load(yaml_str)
                            portfolio_data.append(project_info)
                        except yaml.YAMLError as exc:
                            print(f"Erro ao parsear YAML em {filename}: {exc}")
                    else:
                        print(f"Aviso: {filename} não tem YAML front matter formatado corretamente.")
                else:
                    print(f"Aviso: {filename} não tem YAML front matter. Ignorando.")

    # Salva os dados em um arquivo JSON na pasta 'dist'
    with open(output_json_file, 'w', encoding='utf-8') as f:
        json.dump(portfolio_data, f, indent=2, ensure_ascii=False)

    print(f"Portfólio JSON gerado com sucesso em '{output_json_file}' com {len(portfolio_data)} projetos.")

    # Opcional: Copie os arquivos estáticos (HTML, CSS, JS) para o diretório de saída
    # Isso é útil se você quiser que sua pasta 'dist' seja a única coisa que o GitHub Pages publica.
    # Se você configurar o GitHub Pages para publicar a raiz do seu repositório,
    # então você só precisa que o projects.json vá para a raiz (ou para uma subpasta como 'data/projects.json').

    # Exemplo de cópia (ajuste conforme sua estrutura final de deploy):
    import shutil
    static_files = ['index.html', 'style.css', 'script.js'] # adicione mais se tiver
    for sf in static_files:
        if os.path.exists(sf):
            shutil.copy(sf, os.path.join(output_dir, sf))
            print(f"Copiado: {sf} para {output_dir}")
        else:
            print(f"Aviso: Arquivo estático '{sf}' não encontrado para cópia.")


if __name__ == '__main__':
    build_portfolio()