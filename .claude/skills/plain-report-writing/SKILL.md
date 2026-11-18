---
name: plain-report-writing
description: Write or check report text about data so it reads like a person wrote it, not an AI. Use for the dashboard's Report tab, summaries, and findings.
---

# Plain report writing

Use this when writing or reviewing any report text about data. The goal is text a colleague would write: specific, short, and honest about what the numbers can and can't say.

## Rules

1. **Lead with the finding.** First sentence says what happened, with a number. No warm-up.
2. **Every number comes with its count.** Write "6.3% (284 users)", not "6.3%". Say what the percentage is out of.
3. **Short, plain words.** Say "use", not "leverage". Say "showed", not "underscored". Most sentences under 25 words, and mix long with short.
4. **Say only what the data supports.** A gap inside the chance range is not a finding. A link between two things is not a cause. If the group is small, say so.
5. **State the limits once, in one place.** Do not hedge every sentence ("may potentially suggest").
6. **No filler.** Cut any sentence that carries neither a fact nor a caveat. No intro that announces what the section will say, no closing sentence that repeats it.
7. **No decoration.** No em dashes, no rhetorical questions, no "not just X, but Y", no lists of three adjectives, no headings like "Key Takeaways".
8. **Use the words the reader already knows.** Match the labels on the dashboard ("came back after 7 days").
9. **Neutral report voice.** Write about the data, not to the reader. No "you" (except for plain instructions about the page), no jokes or chatty asides ("Here they are", "just by luck"), and no repeating a number for effect. Say "by chance alone", not "by luck".
10. **State results directly, not in figures of speech.** Give the numbers and say what they mean. Avoid verbs like "stood out", "held up", "fell short" and "came close", which hint at a cutoff without saying what it is.
11. **Don't explain the statistics.** Say "could be chance" and stop. If a sentence needs a second read, cut it or split it. A sentence that is technically exact but hard to follow is worse than a short one that is simply true.

## Check before you finish

1. Run the phrase list against the file and fix every hit that is not a real quote or label:

```bash
grep -n -i -f .claude/skills/plain-report-writing/phrases.txt index.html
```

2. Check each number in the text against the data. Do not trust numbers copied from memory.
3. Read it out loud. If a sentence sounds like a press release, rewrite it.

## Example

Before: "Our analysis reveals a compelling picture of user engagement, highlighting that retention declines significantly over time."

After: "37.0% of users came back after 7 days and 15.1% after 30 days."
