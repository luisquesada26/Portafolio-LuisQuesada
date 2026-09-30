/*==================== I18N ====================*/
/* O HTML fica em inglês; este arquivo troca os textos para PT ou ES
   usando window.TRANSLATIONS (assets/js/translations.js). */
(function () {
    const LANGS = ['en', 'pt', 'es'];
    const HTML_LANG = { en: 'en', pt: 'pt-BR', es: 'es' };
    const COLUMN = { pt: 0, es: 1 };
    // Ainda não existe CV em espanhol: ES baixa o de inglês.
    const CV_FILE = {
        en: 'assets/pdf/CV-Luis-Quesada-EN.pdf',
        pt: 'assets/pdf/CV-Luis-Quesada-PT.pdf',
        es: 'assets/pdf/CV-Luis-Quesada-EN.pdf',
    };
    const STORAGE_KEY = 'selected-lang';
    const dict = window.TRANSLATIONS || {};

    const normalize = text => text.replace(/\s+/g, ' ').trim();

    let current = 'en';

    // Tradução de um texto solto (usada também pelo main.js)
    const t = text => {
        const key = normalize(text);
        if (current === 'en' || !dict[key]) return text;
        return dict[key][COLUMN[current]];
    };

    /*========== Textos da página ==========*/
    // Guarda o texto original (inglês) de cada nó, com os espaços em volta
    const nodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: node => {
            const parent = node.parentElement;
            if (!parent || parent.closest('script, style, svg, [translate="no"]')) return NodeFilter.FILTER_REJECT;
            // Só números e símbolos (14, 200+, ×) não precisam de tradução
            return /\p{L}/u.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const value = node.nodeValue;
        nodes.push({
            node,
            key: normalize(value),
            before: value.match(/^\s*/)[0],
            after: value.match(/\s*$/)[0],
        });
    }

    const attributes = [...document.querySelectorAll('[aria-label]:not([translate="no"] *)')]
        .map(el => ({ el, name: 'aria-label', key: normalize(el.getAttribute('aria-label')) }));

    const title = document.title;
    const description = document.querySelector('meta[name="description"]');
    const descriptionText = description ? description.getAttribute('content') : '';

    /*========== Seletor ==========*/
    const FLAGS = {
        en: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#B22234"/>' +
            '<path d="M0 2.3h30M0 5.4h30M0 8.5h30M0 11.5h30M0 14.6h30M0 17.7h30" stroke="#fff" stroke-width="1.54"/>' +
            '<rect width="13" height="10.8" fill="#3C3B6E"/>' +
            '<g fill="#fff"><circle cx="2.2" cy="2" r=".6"/><circle cx="5.4" cy="2" r=".6"/><circle cx="8.6" cy="2" r=".6"/><circle cx="11" cy="2" r=".6"/>' +
            '<circle cx="3.8" cy="4.2" r=".6"/><circle cx="7" cy="4.2" r=".6"/><circle cx="10" cy="4.2" r=".6"/>' +
            '<circle cx="2.2" cy="6.4" r=".6"/><circle cx="5.4" cy="6.4" r=".6"/><circle cx="8.6" cy="6.4" r=".6"/><circle cx="11" cy="6.4" r=".6"/>' +
            '<circle cx="3.8" cy="8.6" r=".6"/><circle cx="7" cy="8.6" r=".6"/><circle cx="10" cy="8.6" r=".6"/></g></svg>',
        pt: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#009C3B"/>' +
            '<path d="M15 2.2 27.4 10 15 17.8 2.6 10z" fill="#FFDF00"/>' +
            '<circle cx="15" cy="10" r="4.6" fill="#002776"/>' +
            '<path d="M10.5 9.2c3-.9 6.3-.5 9 1.2" stroke="#fff" stroke-width=".8" fill="none"/></svg>',
        es: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#AA151B"/>' +
            '<rect y="5" width="30" height="10" fill="#F1BF00"/></svg>',
    };

    document.querySelectorAll('[data-flag]').forEach(el => { el.innerHTML = FLAGS[el.dataset.flag]; });

    const lang = document.getElementById('lang');
    const button = document.getElementById('lang-button');
    const code = document.getElementById('lang-code');
    const currentFlag = button ? button.querySelector('[data-flag]') : null;
    const options = document.querySelectorAll('.lang__option');
    const cvButton = document.getElementById('cv-button');

    const openMenu = open => {
        if (!lang) return;
        lang.classList.toggle('lang--open', open);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    /*========== Aplicar ==========*/
    const apply = next => {
        current = LANGS.includes(next) ? next : 'en';

        nodes.forEach(({ node, key, before, after }) => {
            const text = current === 'en' || !dict[key] ? key : dict[key][COLUMN[current]];
            node.nodeValue = before + text + after;
        });
        attributes.forEach(({ el, name, key }) => el.setAttribute(name, t(key)));

        document.documentElement.lang = HTML_LANG[current];
        document.title = t(title);
        if (description) description.setAttribute('content', t(descriptionText));
        if (cvButton) cvButton.setAttribute('href', CV_FILE[current]);

        if (code) code.textContent = current.toUpperCase();
        if (currentFlag) currentFlag.innerHTML = FLAGS[current];
        options.forEach(option => option.setAttribute('aria-checked', option.dataset.lang === current ? 'true' : 'false'));

        document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: current } }));
    };

    const choose = next => {
        apply(next);
        try { localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* navegador sem storage */ }
        // Se a página abriu com ?lang=, o link passa a refletir a escolha nova
        const url = new URL(location.href);
        if (url.searchParams.has('lang')) {
            url.searchParams.set('lang', current);
            history.replaceState(null, '', url);
        }
    };

    if (button) {
        button.addEventListener('click', e => {
            e.stopPropagation();
            openMenu(!lang.classList.contains('lang--open'));
        });
        options.forEach(option => option.addEventListener('click', () => {
            choose(option.dataset.lang);
            openMenu(false);
            button.focus();
        }));
        document.addEventListener('click', e => { if (!lang.contains(e.target)) openMenu(false); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') openMenu(false); });
    }

    /*========== Idioma inicial ==========*/
    // ?lang= na URL, depois a escolha salva, depois inglês
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* navegador sem storage */ }
    const fromUrl = new URL(location.href).searchParams.get('lang');
    const initial = [fromUrl, saved].find(l => LANGS.includes(l)) || 'en';
    apply(initial);

    window.i18n = { t, set: choose, get lang() { return current; } };
})();
