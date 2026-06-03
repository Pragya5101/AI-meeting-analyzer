import pdfplumber

def extract_text_from_file(file):
    filename = file.name.lower()
    
    if filename.endswith('.txt'):
        try:
            content = file.read()
            if isinstance(content, bytes):
                return content.decode('utf-8')
            return content
        except UnicodeDecodeError:
            file.seek(0)
            return file.read().decode('latin-1')
            
    elif filename.endswith('.pdf'):
        text = ""
        try:
            with pdfplumber.open(file) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Failed to parse PDF file: {str(e)}")
            
    else:
        raise ValueError("Unsupported file format. Only .txt and .pdf files are supported.")
