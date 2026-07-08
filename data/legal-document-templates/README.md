# Legal Document Templates Dataset

This dataset contains starter templates for legal documents that the Prelegal
system can later customize with user-provided facts.

The templates are generic drafting aids, not legal advice. Any generated or
modified document should be reviewed by a qualified legal professional before
use.

## Format

- `manifest.json` lists every available template and its core metadata.
- `schema.json` describes the expected template object shape.
- `templates/*.json` contains one document template per file.

Each template includes:

- `id`: stable machine-readable identifier;
- `title`: human-readable document name;
- `category`: broad document category;
- `jurisdiction`: intended jurisdiction scope;
- `language`: BCP 47 language tag;
- `variables`: fields the system should collect from the user;
- `sections`: ordered document blocks with placeholders;
- `review_notes`: legal and operational caveats.

Placeholders use double braces, for example `{{company_name}}`.

## Included Templates

- Mutual Non-Disclosure Agreement
- Consulting Services Agreement
- Employment Offer Letter
- Website Privacy Policy
- Limited Power of Attorney
