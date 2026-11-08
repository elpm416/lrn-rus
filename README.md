# Учим русский — Learning Russian

A small browser app with themed lessons for kids. Each lesson has three steps:

1. **Listen** — the browser reads the story aloud and highlights each sentence (and each word, when the voice supports it).
2. **Read** — the child reads the story out loud. "По слогам" splits words into syllables; tapping a word shows it by syllables with a "Hear it" button.
3. **Quiz** — questions about the story, with pictures.

There is no server code and no build step. The app is plain HTML, CSS and JavaScript, and all lesson content lives in `lessons/` as JSON files and pictures.

## Run it on GitHub Pages

1. Open the repository on github.com → **Settings** → **Pages** (left menu).
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch **main** and folder **/ (root)**, then **Save**.
4. Wait a minute or two and refresh the page. GitHub shows the address, which looks like
   `https://<your-username>.github.io/lrn-rus/`.
5. Open that address in **Microsoft Edge** on the kids' laptop. Edge has natural-sounding Russian voices built in. Bookmark it or pin it to the taskbar.

Every time a change is pushed to `main`, the site updates by itself within a minute or two.

## Run it on your own computer

Double-clicking `index.html` does **not** work, because browsers block pages opened from disk from loading the lesson files. Start a tiny local server in this folder instead:

```
python -m http.server 8000
```

Then open http://localhost:8000. (`npx serve` works too.)

## Russian voice on Windows

- **Edge:** Russian "Natural" voices (for example Svetlana, Dmitry) are available without setup.
- **Chrome:** uses Windows voices plus "Google русский". For a Windows voice, add Russian under **Settings → Time & language → Speech → Add voices**.
- The voice button on the Listen screen lets you pick a voice. The choice and the speed are remembered on that computer.

## Adding a lesson

1. Create a folder under `lessons/` named with the lesson id, for example `lessons/my-family/`.
2. Copy `lessons/autumn-park/lesson.json` into it and change the content. Put the pictures in the same folder.
3. Add the id to `lessons/index.json`:
   ```json
   { "lessons": ["autumn-park", "my-family"] }
   ```
4. Commit and push. That's it — no code changes.

### Writing rules

- **Syllables:** mark breaks with `|` in the sentence text: `"Бел|ка со|би|ра|ет о|ре|хи."` The app removes the marks for normal reading and for the voice.
- **Stress marks** (бе́лка) may be added; they are shown but not spoken.
- **Pictures:** every sentence names one of the lesson's `images`. The Listen picture switches when the sentence does.
- **Word meanings** for the tap-a-word popup go in `words`, keyed in lowercase without punctuation or stress marks.
- **Quiz:** `answer` is the position of the correct option, counting from 0. Options are shuffled on screen.
- `lessons/lesson.schema.json` describes the format. Editors like VS Code use it to check a lesson file as you type.

If a lesson file has a mistake, the app shows a message naming the file and the problem instead of a blank page.
