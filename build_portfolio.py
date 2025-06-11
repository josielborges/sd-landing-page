import os
import json
import yaml
import shutil
import markdown # Importe a biblioteca markdown

def build_portfolio():
    projects_dir = 'projects'
    output_dir = 'dist'
    output_json_file = os.path.join(output_dir, 'projects.json')
    detail_pages_output_dir = os.path.join(output_dir, 'projects') # Nova pasta para páginas de detalhes
    detail_template_file = '_project_detail_template.html' # Arquivo de template

    portfolio_data = []

    # Garante que os diretórios de saída existam
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(detail_pages_output_dir, exist_ok=True) # Cria a pasta para os detalhes

    if not os.path.exists(projects_dir):
        print(f"Erro: O diretório '{projects_dir}' não foi encontrado.")
        return

    # Carrega o template da página de detalhes
    try:
        with open(detail_template_file, 'r', encoding='utf-8') as f:
            detail_template_content = f.read()
    except FileNotFoundError:
        print(f"Erro: O arquivo de template '{detail_template_file}' não foi encontrado. Por favor, crie-o na raiz do projeto.")
        return

    for filename in os.listdir(projects_dir):
        if filename.endswith('.md'):
            filepath = os.path.join(projects_dir, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

                # Divide o front matter (YAML) do conteúdo Markdown do corpo
                if content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) > 2:
                        yaml_str = parts[1].strip()
                        markdown_body = parts[2].strip() # Conteúdo Markdown após o front matter
                        try:
                            project_info = yaml.safe_load(yaml_str)
                            
                            # Converte o conteúdo Markdown do corpo para HTML
                            # Usamos extensões para melhor suporte (tabelas, blocos de código, atributos de imagem, quebras de linha)
                            project_html_content = markdown.markdown(markdown_body, extensions=['extra', 'attr_list', 'nl2br'])

                            # Cria um "slug" (nome amigável para URL) para o arquivo da página de detalhes
                            # Preferimos usar 'slug' do YAML se existir, senão, geramos a partir do nome
                            slug = project_info.get('slug', project_info['name'].lower())
                            # Remove caracteres não-alfanuméricos e espaços, substitui por hífens
                            slug = ''.join(c if c.isalnum() else '-' for c in slug).replace('--', '-').strip('-')
                            
                            detail_page_filename = f"{slug}.html"
                            detail_page_path = os.path.join(detail_pages_output_dir, detail_page_filename)
                            
                            # Preenche o template HTML com os dados do projeto
                            rendered_detail_page = detail_template_content.replace('{{ PROJECT_TITLE }}', project_info.get('name', 'Detalhes do Projeto'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_ICON }}', project_info.get('icon', '💡'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_DESCRIPTION }}', project_info.get('description', ''))
                            
                            # Para metatags, junta as tags com vírgula.
                            tags_for_meta = ', '.join(project_info.get('tags', []))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_TAGS }}', tags_for_meta)
                            
                            # Insere o conteúdo HTML do Markdown no template
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_FULL_CONTENT_HTML }}', project_html_content)
                            
                            # Escreve o arquivo HTML da página de detalhes
                            with open(detail_page_path, 'w', encoding='utf-8') as outfile:
                                outfile.write(rendered_detail_page)
                            
                            # Adiciona a URL da página de detalhes aos dados do portfólio (para o projects.json)
                            # O caminho é relativo a 'dist/'
                            project_info['url'] = f"projects/{detail_page_filename}"
                            portfolio_data.append(project_info)

                        except yaml.YAMLError as exc:
                            print(f"Erro ao parsear YAML em {filename}: {exc}")
                        except KeyError:
                            print(f"Aviso: {filename} não possui um campo 'name' no front matter. Ignorando.")
                    else:
                        print(f"Aviso: {filename} não tem YAML front matter formatado corretamente.")
                else:
                    print(f"Aviso: {filename} não tem YAML front matter. Ignorando.")

    # Gera o projects.json com as URLs atualizadas
    with open(output_json_file, 'w', encoding='utf-8') as f:
        json.dump(portfolio_data, f, indent=2, ensure_ascii=False)

    print(f"Portfólio JSON gerado com sucesso em '{output_json_file}' com {len(portfolio_data)} projetos.")

    # Copia os arquivos estáticos para o diretório de saída 'dist'
    static_files_to_copy = ['index.html', 'style.css', 'script.js']
    for sf in static_files_to_copy:
        source_path = sf
        destination_path = os.path.join(output_dir, sf)
        if os.path.exists(source_path):
            shutil.copy(source_path, destination_path)
            print(f"Copiado: {source_path} para {output_dir}")
        else:
            print(f"Aviso: Arquivo estático '{sf}' não encontrado para cópia. Verifique o caminho.")

    print(f"Páginas de detalhes geradas em '{detail_pages_output_dir}'.")


if __name__ == '__main__':
    build_portfolio()