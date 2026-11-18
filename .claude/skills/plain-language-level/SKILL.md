---
name: plain-language-level
description: Check that report text is easy to read for a general audience (about 8th grade, never talking down). Use after writing or editing the dashboard's Report tab or any text about data.
---

# Plain language level

Use this with `plain-report-writing`. That skill catches AI-sounding writing. This one checks that an ordinary reader can follow the text on the first read.

## The target

Someone in high school should be able to read it once and get it. That is about 8th grade. The score script passes anything up to 9th grade.

Do not write down to the reader. No baby talk, no cute comparisons, no cartoon explanations. Plain does not mean childish.

## Rules

1. **Everyday words first.** Say "luck" or "chance", not "statistical significance". Say "looked real", not "passed the test".
2. **Swap technical words for plain ones. If a word has to stay, define it once.** Put a short plain definition in parentheses right after its first use: one clause, with no jargon inside it. Do not define the same word twice. If you can drop the word, drop it.
3. **Say what a result means, not what test produced it.** Readers need "this could be luck", not the name of a method.
4. **One idea per sentence.** Aim for under 20 words. Anything over 25 gets split.
5. **Say numbers the way people say them.** "About 9 in 10", "half of those who clicked".
6. **Keep the same word for the same thing.** If it is "users" once, it is "users" every time, not "people", "visitors" and "accounts".

## Check before you finish

1. Flag technical words in the report. Every hit must be swapped for a plain word, or defined in parentheses at its first use:

```bash
sed -n '/id="view-report"/,/<\/main>/p' index.html | grep -n -i -f .claude/skills/plain-language-level/jargon.txt
```

2. Run the score script on the page:

```bash
python3 -I .claude/skills/plain-language-level/score.py index.html
```

3. It prints an overall grade level, a grade for each section, sentences over 25 words, and long words (4+ syllables). Fix the flagged sentences first, then rerun until it passes.
4. Read the text as someone who has never seen this data. Where would they stop and re-read? Fix that spot.

## What the score cannot do

It only measures sentence length and word length. It cannot tell whether an idea is clear. A sentence can score as easy and still confuse a reader, so step 3 still matters. Short sections give noisy scores, so trust the overall grade more than the section grades.
