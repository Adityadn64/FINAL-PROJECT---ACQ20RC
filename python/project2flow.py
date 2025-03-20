import os
import re
import sys
from graphviz import Digraph
import esprima

def detect_file_dependencies(root_dir):
    """
    Menelusuri semua file dalam root_dir dan mendeteksi dependency sederhana.
    Jika sebuah file (HTML) menautkan file lain (JS/CSS) melalui tag <script> atau <link>,
    maka dependency tersebut dicatat.
    """
    dep_graph = {}
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in ['.html', '.js', '.css']:
                filepath = os.path.join(subdir, file)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception as e:
                    print(f"Error reading {filepath}: {e}")
                    continue

                dependencies = []
                if ext == '.html':
                    scripts = re.findall(r'<script\s+[^>]*src=["\'](.*?)["\']', content, re.IGNORECASE)
                    links = re.findall(r'<link\s+[^>]*href=["\'](.*?)["\']', content, re.IGNORECASE)
                    dependencies.extend(scripts)
                    dependencies.extend(links)
                dep_graph[filepath] = dependencies
    return dep_graph

def build_file_dependency_flowchart(dep_graph, output_file='results/project_file_dependencies'):
    """
    Membuat diagram flowchart dependency antar file menggunakan Graphviz.
    Jika string dependency (misalnya, 'script.js') ditemukan dalam nama file lain, dibuat edge.
    """
    dot = Digraph(comment='Project File Dependencies')
    for file in dep_graph:
        dot.node(file, os.path.basename(file))
    for file, deps in dep_graph.items():
        for dep in deps:
            for candidate in dep_graph:
                if dep in os.path.basename(candidate):
                    dot.edge(file, candidate)
    dot.render(output_file, view=True)
    print(f"Diagram dependency file disimpan sebagai {output_file}.pdf")

def generate_full_js_flowchart(js_file):
    """
    Menghasilkan flowchart yang mencoba mengidentifikasi seluruh _syntax_ yang mempengaruhi
    alur kontrol pada file JavaScript dengan mengurai AST menggunakan esprima.
    Node-node yang dihasilkan mencakup FunctionDeclaration, IfStatement, loop, SwitchStatement,
    ReturnStatement, CallExpression, dan jenis node lainnya.
    """
    try:
        with open(js_file, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception as e:
        print(f"Error reading {js_file}: {e}")
        return None

    try:
        ast = esprima.parseScript(code, tolerant=True)
    except Exception as e:
        print(f"Error parsing {js_file}: {e}")
        return None

    flowchart = Digraph(comment=f'Full JS Flowchart: {os.path.basename(js_file)}')
    node_counter = 0

    def new_node(label):
        nonlocal node_counter
        node_id = f"node{node_counter}"
        node_counter += 1
        flowchart.node(node_id, label)
        return node_id

    def traverse_full(node, parent_node=None):
        if isinstance(node, dict):
            node_type = node.get('type')
            current_node = None

            if node_type == 'FunctionDeclaration':
                func_name = node.get('id', {}).get('name', 'anonymous')
                current_node = new_node(f'Function: {func_name}')
            elif node_type == 'IfStatement':
                current_node = new_node('If Statement')
            elif node_type in ['ForStatement', 'WhileStatement', 'DoWhileStatement']:
                current_node = new_node(node_type)
            elif node_type == 'SwitchStatement':
                current_node = new_node('Switch Statement')
            elif node_type == 'ReturnStatement':
                current_node = new_node('Return')
            elif node_type == 'CallExpression':
                callee = node.get('callee')
                if callee and callee.get('type') == 'Identifier':
                    current_node = new_node(f'Call: {callee.get("name")}')

            else:

                current_node = new_node(node_type)

            if parent_node and current_node:
                flowchart.edge(parent_node, current_node)
            new_parent = current_node if current_node else parent_node
            for key, value in node.items():

                if key in ['loc', 'range', 'raw']:
                    continue
                traverse_full(value, parent_node=new_parent)
        elif isinstance(node, list):
            for item in node:
                traverse_full(item, parent_node=parent_node)

    traverse_full(ast.toDict(), parent_node=None)
    return flowchart

def build_all_full_js_flowcharts(root_dir, output_folder='results/full_js_flowcharts'):
    """
    Menelusuri seluruh file dalam root_dir, dan untuk setiap file JS menghasilkan flowchart
    lengkap dari seluruh syntax yang mempengaruhi alur. Flowchart disimpan di output_folder.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext == '.js':
                js_file = os.path.join(subdir, file)
                print(f"Memproses {js_file} untuk flowchart lengkap...")
                flowchart = generate_full_js_flowchart(js_file)
                if flowchart:
                    base_name = os.path.splitext(os.path.basename(js_file))[0]
                    output_name = os.path.join(output_folder, base_name + '_full_flowchart')
                    flowchart.render(output_name, view=False)
                    print(f"Flowchart lengkap untuk {js_file} disimpan sebagai {output_name}.pdf")

if __name__ == '__main__':
    root_directory = '/content/drive/MyDrive/Developer/Project/Competition/Alhazen Coding Quest 20 Days Ramadhan Challenge/FINAL PROJECT'

    dependency_graph = detect_file_dependencies(root_directory)
    print("Dependency Graph Antar File:")
    for file, deps in dependency_graph.items():
        print(f"{file}: {deps}")
    build_file_dependency_flowchart(dependency_graph)

    build_all_full_js_flowcharts(root_directory)

    sys.stdout.flush()
    input("Tekan Enter untuk keluar...")