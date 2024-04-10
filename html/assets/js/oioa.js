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

        this.words = [];
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
                this.words = res;
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
            this.subset = this.words
                .reduce((obj, entry) => {
                    const wholeExp = new RegExp(`(^|\\W)${this.query}($|\\W)`);
                    let match = false;
                    let whole = false;

                    let definition = entry.definition.toLowerCase();

                    if (this.searchBy.head) {
                        if (entry.head === this.query) {
                            match = true;
                            whole = true;
                        } else if (entry.head.includes(this.query)) {
                            match = true;
                        }
                    }
                    if (this.searchBy.definition) {
                        if (wholeExp.test(entry.definition)) {
                            match = true;
                            whole = true;
                        } else if (entry.definition.includes(this.query)) {
                            match = true;
                        }
                    }
                    if (entry.examples && (this.searchBy.exampleEn || this.searchBy.exampleLl)) {
                        entry.examples.forEach((example) => {
                            if (this.searchBy.exampleLl && example.ll.toLowerCase().includes(this.query)) {
                                match = true;
                            } else if (this.searchBy.exampleEn && example.en.toLowerCase().includes(this.query)) {
                                match = true;
                            }
                        });
                    }
                    if (match) {
                        obj.push({
                            entry: entry,
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
            this.subset = this.words.reduce((obj, entry) => {
                obj.push({
                    entry: entry,
                    whole: true
                });
                return obj;
            }, []);
        }
        this.subsetLength = this.subset.length;
        document.title = `oioa lioa (${this.subsetLength})`;
        this.render();
    }

    render() {
        this.list.innerHTML = "";
        this.subset.forEach((set) => {
            let item = document.createElement("li");
            let word = set.entry;
            let regexp = new RegExp(`(${this.query})`, "i");
            let definition = word.definition.replace(regexp, `<span class="regex-match">$1</span>`);
            item.setAttribute("class", set.whole ? "whole" : "partial");
            item.innerHTML = `<h2>${word.head}</h2><p>${definition}</p>`;
            if (word.examples) {
                let examples = document.createElement("ul");
                examples.setAttribute("class", "examples");
                word.examples.forEach((example) => {
                    let exampleItem = document.createElement("li");
                    let exampleLl = example.ll.replace(regexp, `<span class="regex-match">$1</span>`);
                    let exampleEn = example.en.replace(regexp, `<span class="regex-match">$1</span>`);
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
