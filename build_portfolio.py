import os
import json
import yaml
import shutil
import markdown

def build_portfolio():
    projects_dir = 'projects'
    output_dir = 'dist'
    output_json_file = os.path.join(output_dir, 'projects.json')
    detail_pages_output_dir = os.path.join(output_dir, 'projects')
    detail_template_file = '_project_detail_template.html'

    portfolio_data = []

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(detail_pages_output_dir, exist_ok=True)

    try:
        with open(detail_template_file, 'r', encoding='utf-8') as f:
            detail_template_content = f.read()
    except FileNotFoundError:
        print(f"Erro: O arquivo de template '{detail_template_file}' não foi encontrado.")
        return

    if not os.path.exists(projects_dir):
        print(f"Erro: O diretório '{projects_dir}' não foi encontrado.")
        return

    # --- LÓGICA PRINCIPAL MODIFICADA ---
    # Itera sobre os subdiretórios na pasta 'projects'
    for project_slug in os.listdir(projects_dir):
        project_path = os.path.join(projects_dir, project_slug)

        # Verifica se é um diretório
        if os.path.isdir(project_path):
            md_file_path = os.path.join(project_path, 'index.md')

            # Verifica se o arquivo index.md existe
            if os.path.exists(md_file_path):
                with open(md_file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                if content.startswith('---'):
                    parts = content.split('---', 2)
                    if len(parts) > 2:
                        yaml_str = parts[1].strip()
                        markdown_body = parts[2].strip()
                        try:
                            project_info = yaml.safe_load(yaml_str)
                            
                            # Cria o diretório de saída para este projeto específico
                            output_project_dir = os.path.join(detail_pages_output_dir, project_slug)
                            os.makedirs(output_project_dir, exist_ok=True)
                            
                            # Converte o corpo do Markdown para HTML
                            project_html_content = markdown.markdown(markdown_body, extensions=['extra', 'attr_list', 'nl2br'])
                            
                            # Preenche o template
                            rendered_detail_page = detail_template_content.replace('{{ PROJECT_TITLE }}', project_info.get('name', 'Detalhes do Projeto'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_ICON }}', project_info.get('icon', '💡'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_DESCRIPTION }}', project_info.get('description', ''))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_FULL_CONTENT_HTML }}', project_html_content)
                            
                            # Salva o arquivo index.html do projeto
                            output_html_path = os.path.join(output_project_dir, 'index.html')
                            with open(output_html_path, 'w', encoding='utf-8') as outfile:
                                outfile.write(rendered_detail_page)

                            # Copia todos os outros arquivos (imagens, etc.) da pasta do projeto
                            for item in os.listdir(project_path):
                                if item != 'index.md':
                                    source_item = os.path.join(project_path, item)
                                    dest_item = os.path.join(output_project_dir, item)
                                    if os.path.isfile(source_item):
                                        shutil.copy2(source_item, dest_item)

                            # Adiciona a URL correta (apontando para o diretório)
                            github_pages_repo_name = "/sd-landing-page"
                            project_info['url'] = f"{github_pages_repo_name}/projects/{project_slug}/"
                            portfolio_data.append(project_info)

                        except yaml.YAMLError as exc:
                            print(f"Erro ao parsear YAML em {md_file_path}: {exc}")
                        except KeyError:
                            print(f"Aviso: {md_file_path} não possui um campo 'name'. Ignorando.")

    # Gera o projects.json com as URLs atualizadas
    with open(output_json_file, 'w', encoding='utf-8') as f:
        json.dump(portfolio_data, f, indent=2, ensure_ascii=False)

    print(f"Portfólio JSON gerado com sucesso em '{output_json_file}' com {len(portfolio_data)} projetos.")

    # Copia os arquivos estáticos da raiz para o diretório 'dist'
    static_files_to_copy = ['index.html', 'style.css', 'script.js']
    for sf in static_files_to_copy:
        source_path = sf
        destination_path = os.path.join(output_dir, sf)
        if os.path.exists(source_path):
            shutil.copy(source_path, destination_path)
            print(f"Copiado: {source_path} para {output_dir}")

    print(f"Páginas de detalhes e assets dos projetos gerados em '{detail_pages_output_dir}'.")


if __name__ == '__main__':
    build_portfolio()