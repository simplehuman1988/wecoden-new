# Wecoden Journal editor

The editor is available at `https://wecoden.com/admin/` after the site update is published.

## One-time setup by the site owner

The site is hosted as static GitHub Pages. The editor keeps drafts in the current browser and commits a post to GitHub only when it is published. On the computer that will manage publishing:

1. Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) for `simplehuman1988/wecoden-new`.
2. Grant **Contents: Read and write** access to that repository. No other repository access is needed.
3. Open `/admin/`, choose **Connect editor**, paste the token, and connect. The token is saved in that browser's local storage. Use **Disconnect** to remove it.

The token is a write credential. Keep it in the publishing browser and do not send it to authors. A site owner can connect the editor on the author's computer once if they want the author to use this form. Published posts are saved with the generated article page and Journal listing data in one commit, which triggers the repository's GitHub Pages deployment workflow.

## Writing a post

1. Open `https://wecoden.com/admin/` and choose **Write a new post**.
2. Enter the title, short introduction, category, author, date, and article. The page address fills itself from the title. The toolbar inserts common Markdown formatting. A cover image is optional.
3. Choose **Save draft** to keep it in this browser, or **Publish post** to publish it. Browser drafts are not shared across devices and are cleared if browser storage is cleared. A new cover image uploads when you publish; select it again if you close the editor before publishing.
4. The editor saves the content source, creates `blog-posts/<page-address>.html`, and refreshes `blog-posts/index.json` in one repository commit. GitHub Pages publishes the change; it can take a few minutes to appear on the live site.

Published articles use the same header, footer, typography, and article layout as the existing Wecoden Journal pages. Existing hand-authored journal pages remain available.

## Repository workflow

Post source files are stored in `content/blog-posts/` as JSON. The editor writes generated pages to the same commit so they publish with the existing static site. `scripts/build_blog.py` can also regenerate the published pages and feed from those source files locally:

```sh
python3 scripts/build_blog.py
```
