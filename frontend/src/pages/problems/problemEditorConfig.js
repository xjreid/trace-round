import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { cpp } from '@codemirror/lang-cpp'

export const languages = ['Python', 'Java', 'C++', 'Javascript']

export const languageExtensions = {
  Python: [python()],
  Java: [java()],
  'C++': [cpp()],
  Javascript: [javascript()],
}

export const editorSetup = {
  lineNumbers: false,
  highlightActiveLineGutter: false,
  foldGutter: false,
  indentOnInput: false,
  bracketMatching: false,
  closeBrackets: false,
  autocompletion: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: false,
  completionKeymap: false,
  foldKeymap: false,
  lintKeymap: false,
  tabSize: 2,
}
