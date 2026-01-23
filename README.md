# Muhammad Hassan - Portfolio Website

A modern, animated personal portfolio website built with HTML, CSS, and JavaScript.

## 🚀 Features
- **Responsive Design:** Optimized for Mobile, Tablet, and Desktop.
- **Animations:** Smooth scroll, fade-in effects, and typing animation.
- **Interactive:** Sticky navigation, hover effects, and contact form validation.
- **Dark Mode:** Premium dark aesthetic with neon accents.

## 📂 Project Structure
```
portfolio/
├── index.html       # Main HTML file
├── css/
│   └── styles.css   # Global styles and animations
├── js/
│   └── main.js      # Interaction logic
└── assets/          # Images and resources
```

## 🌐 Alignment
Inspired by [dixieraizpacheco.com](https://dixieraizpacheco.com/), adapting the layout conventions and premium feel.

## 📦 Deployment Instructions (GitHub Pages)

1.  **Initialize Git:**
    Open a terminal in this folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit: Portfolio website"
    ```

2.  **Create a Repository:**
    Go to [GitHub.com/new](https://github.new) and create a repository named `About-Hassan`.

3.  **Push Code:**
    ```bash
    git branch -M main
    git remote add origin https://github.com/MHassanGull/About-Hassan.git
    # (Replace URL with your actual new repo URL)
    git push -u origin main
    ```

4.  **Enable GitHub Pages:**
    - Go to your Repository **Settings** > **Pages**.
    - Under **Source**, select `Deploy from a branch`.
    - Select `main` branch and `/ (root)` folder.
    - Click **Save**.
    - GitHub will give you a live URL (e.g., `https://mhassangull.github.io/About-Hassan/`).

## 🐍 Optional Backend (Django)
This site is static. If you want to handle the contact form with a real Python backend later:
1. Create a simple Django/FastAPI service.
2. Host it on Vercel/Render.
3. Update `js/main.js` to `fetch()` your API endpoint on form submit.
