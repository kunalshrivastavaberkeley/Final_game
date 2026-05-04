export const WRONG_CHOICES = [
  { id: 'hammer',      label: '> try using a hammer'   },
  { id: 'screwdriver', label: '> try a screwdriver'    },
  { id: 'recursion',   label: '> try recursion'  },
  { id: 'ask',         label: "> ask what's wrong",    locked: true },
]

export const WRONG_RESPONSES = {
  hammer:      '[child]: nooo, that would hurt it',
  screwdriver: '[child]: its not that kind of broken...',
  recursion:   '[child]: what is a recursion?',
}

export const NARROWING_QUESTIONS = [
  {
    id: 'q_where',
    label: '> where did you last have it?',
    response: '[child]: i had it near the shelf',
  },
  {
    id: 'q_what',
    label: '> what does it look like?',
    response: '[child]: it looks like a little witch. with purple hair. and yellow eyes. and a big hat.',
  },
  {
    id: 'q_when',
    label: '> when did you lose it?',
    response: "[child]: i dont remember exactly. a while ago i think.",
  },
]
