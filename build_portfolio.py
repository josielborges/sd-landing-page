# build_portfolio.py (substitua a função build_portfolio)
import os
import json
import yaml
import shutil
import markdown

REPO_NAME = '/sd-landing-page'

def build_portfolio():
    
    projects_dir = 'projects'
    assets_dir = 'assets'
    output_dir = 'dist'
    output_json_file = os.path.join(output_dir, 'projects.json')
    detail_pages_output_dir = os.path.join(output_dir, 'projects')
    dis_assets_dir = os.path.join(output_dir, 'assets')
    detail_template_file = '_project_detail_template.html'

    portfolio_data = []

    # Garante que os diretórios de saída existam
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(detail_pages_output_dir, exist_ok=True)
    os.makedirs(dis_assets_dir, exist_ok=True)

    try:
        with open(detail_template_file, 'r', encoding='utf-8') as f:
            detail_template_content = f.read()
    except FileNotFoundError:
        print(f"Erro: O arquivo de template '{detail_template_file}' não foi encontrado.")
        return

    if not os.path.exists(projects_dir):
        print(f"Erro: O diretório '{projects_dir}' não foi encontrado.")
        return

    # Itera sobre os subdiretórios na pasta 'projects'
    for project_slug in os.listdir(projects_dir):
        project_path = os.path.join(projects_dir, project_slug)

        if os.path.isdir(project_path):
            md_file_path = os.path.join(project_path, 'index.md')

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

                            project_info['slug'] = project_slug 
                            
                            output_project_dir = os.path.join(detail_pages_output_dir, project_slug)
                            os.makedirs(output_project_dir, exist_ok=True)
                            
                            project_html_content = markdown.markdown(markdown_body, extensions=['extra', 'attr_list', 'nl2br'])
                            
                            # --- LÓGICA ATUALIZADA PARA O NOVO TEMPLATE ---
                            rendered_detail_page = detail_template_content
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_TITLE }}', project_info.get('name', 'Título do Projeto'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_ICON }}', project_info.get('icon', '💡'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_DESCRIPTION }}', project_info.get('description', ''))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_CLIENT }}', project_info.get('client', 'N/A'))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_YEAR }}', str(project_info.get('year', '----')))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_FULL_CONTENT_HTML }}', project_html_content)

                            # Gera o HTML para as tags
                            tags_html = ''.join(f'<span class="tag">{tag.strip()}</span>' for tag in project_info.get('tags', []))
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_TAGS_HTML }}', tags_html)

                            # Gera o HTML para o botão de "site ao vivo" (opcional)
                            live_url = project_info.get('live_url')
                            button_html = ''
                            if live_url:
                                button_html = f'<a href="{live_url}" class="info-cta-button" target="_blank">Visitar Projeto <i class="fas fa-external-link-alt"></i></a>'
                            rendered_detail_page = rendered_detail_page.replace('{{ PROJECT_LIVE_URL_BUTTON_HTML }}', button_html)
                            # --- FIM DA LÓGICA ATUALIZADA ---

                            output_html_path = os.path.join(output_project_dir, 'index.html')
                            with open(output_html_path, 'w', encoding='utf-8') as outfile:
                                outfile.write(rendered_detail_page)

                            for item in os.listdir(project_path):
                                if item != 'index.md':
                                    source_item, dest_item = os.path.join(project_path, item), os.path.join(output_project_dir, item)
                                    if os.path.isfile(source_item): shutil.copy2(source_item, dest_item)

                            portfolio_data.append(project_info)

                        except yaml.YAMLError as exc:
                            print(f"Erro ao parsear YAML em {md_file_path}: {exc}")

    with open(output_json_file, 'w', encoding='utf-8') as f:
        json.dump(portfolio_data, f, indent=2, ensure_ascii=False)
    print(f"Portfólio JSON gerado com sucesso com {len(portfolio_data)} projetos.")
    static_files_to_copy = ['index.html', 'style.css', 'script.js']
    for sf in static_files_to_copy:
        source_path, destination_path = sf, os.path.join(output_dir, sf)
        if os.path.exists(source_path): shutil.copy(source_path, destination_path)


    # Copia os assets para o diretório de assets dos detalhes dos projetos
    if os.path.exists(assets_dir):
        for asset in os.listdir(assets_dir):
            source_asset_path = os.path.join(assets_dir, asset)
            destination_asset_path = os.path.join(dis_assets_dir, asset)
            if os.path.isfile(source_asset_path):
                shutil.copy2(source_asset_path, destination_asset_path)
                print(f"Copiado: {source_asset_path} para {dis_assets_dir}")

    print("Build do portfólio concluído.")
    

if __name__ == '__main__':
    build_portfolio()