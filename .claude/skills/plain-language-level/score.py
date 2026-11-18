"""Reading-level check for the Report tab.

Usage: python3 -I score.py index.html [max_grade]

Reads the text inside <main id="view-report"> (paragraphs and list items),
then prints the Flesch-Kincaid grade level overall and per section, plus
sentences over 25 words and words with 4 or more syllables.
Exits with code 1 if the overall grade is above max_grade (default 9).
"""
import re
import sys
from html.parser import HTMLParser

MAX_GRADE_DEFAULT = 9.0
LONG_SENTENCE = 25


class ReportText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_report = False
        self.section = "Intro"
        self.units = []  # (section, text)
        self.cur = None

    def handle_starttag(self, tag, attrs):
        if tag == "main" and dict(attrs).get("id") == "view-report":
            self.in_report = True
            return
        if self.in_report and tag in ("p", "li", "h3"):
            self.cur = []

    def handle_endtag(self, tag):
        if tag == "main" and self.in_report:
            self.in_report = False
            return
        if self.in_report and tag in ("p", "li", "h3") and self.cur is not None:
            text = " ".join("".join(self.cur).split())
            self.cur = None
            if tag == "h3":
                self.section = text
            elif text:
                self.units.append((self.section, text))

    def handle_data(self, data):
        if self.in_report and self.cur is not None:
            self.cur.append(data)


WORD = re.compile(r"[A-Za-z][A-Za-z'-]*|\d[\d,.]*%?")


def syllables(word):
    if not word[0].isalpha():
        return 1  # numbers count as one short word
    w = word.lower().strip("'-")
    if len(w) <= 3:
        return 1
    w = re.sub(r"(?:[^laeiouy]es|ed|[^laeiouy]e)$", "", w)
    w = re.sub(r"^y", "", w)
    return max(1, len(re.findall(r"[aeiouy]{1,2}", w)))


def sentences(text):
    text = text.rstrip(":;,")
    if text and text[-1] not in ".!?":
        text += "."  # list items count as one sentence
    return [s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", text) if s.strip()]


def stats(sents):
    words = [w for s in sents for w in WORD.findall(s)]
    if not sents or not words:
        return None
    syl = sum(syllables(w) for w in words)
    grade = 0.39 * (len(words) / len(sents)) + 11.8 * (syl / len(words)) - 15.59
    return grade, len(words), len(sents)


def main():
    path = sys.argv[1]
    max_grade = float(sys.argv[2]) if len(sys.argv) > 2 else MAX_GRADE_DEFAULT
    parser = ReportText()
    parser.feed(open(path, encoding="utf-8").read())

    by_section = {}
    all_sents = []
    for section, text in parser.units:
        ss = sentences(text)
        by_section.setdefault(section, []).extend(ss)
        all_sents.extend(ss)

    overall = stats(all_sents)
    if not overall:
        print("No report text found.")
        sys.exit(2)
    grade, nwords, nsents = overall
    verdict = "PASS" if grade <= max_grade else "TOO HARD"
    print(f"Overall grade level: {grade:.1f}  ({nwords} words, {nsents} sentences)  limit {max_grade:g}  -> {verdict}")

    print("\nBy section (rough; short sections are noisy):")
    for section, ss in by_section.items():
        s = stats(ss)
        if s:
            print(f"  {s[0]:5.1f}  {section}")

    long_ones = [s for s in all_sents if len(WORD.findall(s)) > LONG_SENTENCE]
    print(f"\nSentences over {LONG_SENTENCE} words: {len(long_ones)}")
    for s in long_ones:
        print(f"  - ({len(WORD.findall(s))} words) {s}")

    hard = {}
    for s in all_sents:
        for w in WORD.findall(s):
            if w[0].isalpha() and syllables(w) >= 4:
                hard[w.lower()] = hard.get(w.lower(), 0) + 1
    print("\nLong words (4+ syllables):", ", ".join(f"{w} x{n}" if n > 1 else w for w, n in sorted(hard.items())) or "none")

    sys.exit(0 if grade <= max_grade else 1)


if __name__ == "__main__":
    main()
