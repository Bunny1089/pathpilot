from typing import Dict, List, Any

def chunk_resume(sections: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Splits resume sections into semantic, section-aware text chunks.
    Injects context into the embedded content to preserve structural details.
    """
    chunks = []
    chunk_counter = 0
    
    for section_name, section_text in sections.items():
        if not section_text.strip():
            continue
            
        # Select strategy depending on section type
        if section_name in ["Header", "Summary"]:
            # Summary and Header details are usually short paragraphs; split by double newlines
            paragraphs = [p.strip() for p in section_text.split('\n\n') if p.strip()]
            for p in paragraphs:
                chunks.append({
                    "chunk_index": chunk_counter,
                    "section": section_name,
                    "content": p,
                    "text_to_embed": f"Section: {section_name}\n\n{p}"
                })
                chunk_counter += 1
                
        elif section_name == "Skills":
            # Skills sections are lists where each line represents a skill category
            lines = [line.strip() for line in section_text.split('\n') if line.strip()]
            for line in lines:
                chunks.append({
                    "chunk_index": chunk_counter,
                    "section": section_name,
                    "content": line,
                    "text_to_embed": f"Section: {section_name}\n\n{line}"
                })
                chunk_counter += 1
                
        else:
            # Experience, Projects, Education, Certifications
            # These are block entries. We split by double newlines (\n\n) to preserve whole entities (e.g. job roles, degrees)
            blocks = [b.strip() for b in section_text.split('\n\n') if b.strip()]
            for block in blocks:
                chunks.append({
                    "chunk_index": chunk_counter,
                    "section": section_name,
                    "content": block,
                    "text_to_embed": f"Section: {section_name}\n\n{block}"
                })
                chunk_counter += 1
                
    return chunks
