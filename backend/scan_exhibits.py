import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')

doc_dir = os.path.join(os.path.dirname(__file__), 'data', 'projects', 'dehuan_liu', 'documents')
files = sorted([f for f in os.listdir(doc_dir) if f.endswith('.json')])
for fname in files:
    with open(os.path.join(doc_dir, fname), 'r', encoding='utf-8') as fh:
        data = json.load(fh)
    eid = data.get('exhibit_id', fname.replace('.json',''))
    pages = data.get('pages', [])
    total_blocks = data.get('total_blocks', 0)

    text_blocks = 0
    image_blocks = 0
    total_chars = 0
    for page in pages:
        for block in page.get('text_blocks', []):
            bt = block.get('block_type', '')
            tc = block.get('text_content', '')
            if bt == 'image':
                image_blocks += 1
            else:
                text_blocks += 1
                total_chars += len(tc)

    first_text = ''
    for page in pages:
        if page['page_number'] == 1:
            continue
        for block in page.get('text_blocks', []):
            tc = block.get('text_content', '')
            if tc and block.get('block_type', '') not in ('image',) and len(tc) > 20:
                first_text = tc[:120].replace('\n', ' ')
                break
        if first_text:
            break

    print(f'{eid}|{len(pages)}p|{text_blocks}t/{image_blocks}i|{total_chars}c|{first_text}')
