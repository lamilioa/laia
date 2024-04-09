class OioaLioa {
    constructor() {
        this.results = document.querySelector(".results");
        this.status = document.querySelector(".results-status");
        this.list = document.querySelector(".results-list");
        this.input = document.querySelector("#search_query");

        this.query = "";
        this.page = 1;
        this.limit = 24;
        this.searchBy = {
            head: true,
            definition: true,
            exampleEn: false,
            exampleLl: false
        };

        this.words = {};
        this.subset = [];
        this.subsetLength = 0;

        document.querySelectorAll(`.search-input-options input[type="checkbox"]`).forEach((element) => {
            element.addEventListener("change", this.onFilterChange.bind(this));
        });

        this.input.addEventListener("input", this.onInputChange.bind(this));

        this.fetchWords();
    }

    fetchWords() {
        fetch("https://sako.lamilioa.org/word")
            .then((res) => {
                if (res.error) {
                    throw error();
                }
                return res.json();
            })
            .then((res) => {
                this.words = res.body;
                this.update();
                this.status.innerHTML = "";
            })
            .catch((err) => {
                console.log(err);
                this.status.innerHTML = "could not load words :(";
            });
    }

    onInputChange(event) {
        this.query = event.target.value;
        this.update();
    }

    onFilterChange(event) {
        this.searchBy[event.target.dataset.searchBy] = event.target.checked;
        this.update();
    }

    update() {
        if (this.query.length > 0) {
            this.query = this.query.toLowerCase();
            this.subset = Object.keys(this.words)
                .reduce((obj, key) => {
                    const wholeExp = new RegExp(`(^|\\W)${this.query}($|\\W)`);
                    let match = false;
                    let whole = false;

                    let definition = this.words[key].definition.toLowerCase();

                    if (this.searchBy.head) {
                        if (key == this.query) {
                            match = true;
                            whole = true;
                        } else if (key.includes(this.query)) {
                            match = true;
                        }
                    }
                    if (this.searchBy.definition) {
                        if (wholeExp.test(definition)) {
                            match = true;
                            whole = true;
                        } else if (definition.includes(this.query)) {
                            match = true;
                        }
                    }
                    if (this.words[key].examples && (this.searchBy.exampleEn || this.searchBy.exampleLl)) {
                        this.words[key].examples.forEach((example) => {
                            if (this.searchBy.exampleLl && example[0].toLowerCase().includes(this.query)) {
                                match = true;
                            } else if (this.searchBy.exampleEn && example[1].toLowerCase().includes(this.query)) {
                                match = true;
                            }
                        });
                    }
                    if (match) {
                        obj.push({
                            key: key,
                            whole
                        });
                    }
                    return obj;
                }, [])
                .sort((a, b) => {
                    if (a.whole == b.whole) return b.key - a.key;
                    return a.whole ? -1 : 1;
                });
        } else {
            this.subset = Object.keys(this.words).reduce((obj, key) => {
                obj.push({
                    key: key,
                    whole: true
                });
                return obj;
            }, []);
        }
        this.subsetLength = Object.keys(this.subset).length;
        document.title = `oioa lioa (${this.subsetLength})`;
        this.render();
    }

    render() {
        this.list.innerHTML = "";
        this.subset.forEach((set) => {
            let item = document.createElement("li");
            let word = this.words[set.key];
            let regexp = new RegExp(`(${this.query})`, "i");
            let definition = word.definition.replace(regexp, `<span class="regex-match">$1</span>`);
            item.setAttribute("class", set.whole ? "whole" : "partial");
            item.innerHTML = `<h2>${set.key}</h2><p>${definition}</p>`;
            if (word.examples) {
                let examples = document.createElement("ul");
                examples.setAttribute("class", "examples");
                word.examples.forEach((example) => {
                    let exampleItem = document.createElement("li");
                    let exampleLl = example[0].replace(regexp, `<span class="regex-match">$1</span>`);
                    let exampleEn = example[1].replace(regexp, `<span class="regex-match">$1</span>`);
                    exampleItem.innerHTML = `<span class="example-ll">${exampleLl}</span><span class="example-en">${exampleEn}</span>`;
                    examples.appendChild(exampleItem);
                });
                item.appendChild(examples);
            }
            this.list.appendChild(item);
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.oioaLioa = new OioaLioa();
});
