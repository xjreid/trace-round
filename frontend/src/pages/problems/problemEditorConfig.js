import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { javascript } from '@codemirror/lang-javascript'
import { cpp } from '@codemirror/lang-cpp'
import {
  HighlightStyle,
  indentUnit,
  syntaxTree,
  syntaxHighlighting,
} from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
} from '@codemirror/view'
import { tags } from '@lezer/highlight'

export const languages = ['Python', 'Java', 'C++', 'JavaScript']

export const languageExtensions = {
  Python: [python()],
  Java: [java()],
  'C++': [cpp()],
  JavaScript: [javascript()],
}

const leetCodeColors = {
  foreground: '#D4D4D4',
  keyword: '#679BD1',
  control: '#BC89BD',
  type: '#72C7B1',
  function: '#DCDCAF',
  variable: '#AADAFB',
  constant: '#6FBFFA',
  string: '#C5947C',
  number: '#BACDAC',
  comment: '#74985D',
  regexp: '#C46F6C',
  invalid: '#F44747',
}

const commonHighlightRules = [
  {
    tag: [
      tags.comment,
      tags.lineComment,
      tags.blockComment,
      tags.docComment,
    ],
    color: leetCodeColors.comment,
  },
  {
    tag: [
      tags.string,
      tags.docString,
      tags.character,
      tags.attributeValue,
      tags.special(tags.string),
    ],
    color: leetCodeColors.string,
  },
  {
    tag: tags.regexp,
    color: leetCodeColors.regexp,
  },
  {
    tag: [tags.number, tags.integer, tags.float],
    color: leetCodeColors.number,
  },
  {
    tag: [tags.bool, tags.null, tags.atom],
    color: leetCodeColors.keyword,
  },
  {
    tag: [tags.typeName, tags.className, tags.namespace],
    color: leetCodeColors.type,
  },
  {
    tag: [tags.propertyName, tags.attributeName],
    color: leetCodeColors.variable,
  },
  {
    tag: [
      tags.name,
      tags.variableName,
      tags.operator,
      tags.punctuation,
      tags.bracket,
    ],
    color: leetCodeColors.foreground,
  },
  {
    tag: tags.invalid,
    color: leetCodeColors.invalid,
    textDecoration: 'underline',
  },
]

const functionHighlightRule = {
  tag: [
    tags.function(tags.variableName),
    tags.function(tags.propertyName),
    tags.labelName,
  ],
  color: leetCodeColors.function,
}

const cppHighlightStyle = HighlightStyle.define([
  ...commonHighlightRules,
  {
    tag: [tags.definitionKeyword, tags.modifier, tags.operatorKeyword],
    color: leetCodeColors.keyword,
  },
  {
    tag: [tags.controlKeyword, tags.keyword],
    color: leetCodeColors.control,
  },
  {
    tag: tags.standard(tags.typeName),
    color: leetCodeColors.keyword,
  },
  {
    tag: tags.processingInstruction,
    color: leetCodeColors.control,
  },
  {
    tag: [tags.macroName, tags.constant(tags.variableName), tags.meta],
    color: leetCodeColors.constant,
  },
  {
    tag: tags.definition(tags.variableName),
    color: leetCodeColors.variable,
  },
  functionHighlightRule,
])

const javaHighlightStyle = HighlightStyle.define([
  ...commonHighlightRules,
  {
    tag: [
      tags.definitionKeyword,
      tags.moduleKeyword,
      tags.modifier,
      tags.operatorKeyword,
    ],
    color: leetCodeColors.keyword,
  },
  {
    tag: [tags.controlKeyword, tags.keyword],
    color: leetCodeColors.control,
  },
  {
    tag: [tags.annotation, tags.meta],
    color: leetCodeColors.type,
  },
  {
    tag: tags.definition(tags.variableName),
    color: leetCodeColors.variable,
  },
  functionHighlightRule,
])

const pythonHighlightStyle = HighlightStyle.define([
  ...commonHighlightRules,
  {
    tag: [tags.definitionKeyword, tags.modifier, tags.operatorKeyword],
    color: leetCodeColors.keyword,
  },
  {
    tag: [tags.moduleKeyword, tags.controlKeyword, tags.keyword],
    color: leetCodeColors.control,
  },
  {
    tag: tags.self,
    color: leetCodeColors.keyword,
  },
  {
    tag: [tags.annotation, tags.meta],
    color: leetCodeColors.function,
  },
  {
    tag: tags.definition(tags.variableName),
    color: leetCodeColors.function,
  },
  functionHighlightRule,
])

const javascriptHighlightStyle = HighlightStyle.define([
  ...commonHighlightRules,
  {
    tag: [tags.definitionKeyword, tags.modifier],
    color: leetCodeColors.keyword,
  },
  {
    tag: [
      tags.moduleKeyword,
      tags.controlKeyword,
      tags.operatorKeyword,
      tags.keyword,
    ],
    color: leetCodeColors.control,
  },
  {
    tag: tags.self,
    color: leetCodeColors.keyword,
  },
  {
    tag: tags.definition(tags.variableName),
    color: leetCodeColors.constant,
  },
  functionHighlightRule,
])

const leetCodeHighlightStyles = {
  Python: pythonHighlightStyle,
  Java: javaHighlightStyle,
  'C++': cppHighlightStyle,
  JavaScript: javascriptHighlightStyle,
}

const semanticColorClasses = new Map([
  [leetCodeColors.keyword, 'cm-leetcode-keyword'],
  [leetCodeColors.type, 'cm-leetcode-type'],
  [leetCodeColors.function, 'cm-leetcode-function'],
  [leetCodeColors.variable, 'cm-leetcode-variable'],
])

export const editorTheme = EditorView.theme(
  {
    '.cm-leetcode-keyword, .cm-leetcode-keyword *': {
      color: `${leetCodeColors.keyword} !important`,
    },
    '.cm-leetcode-type, .cm-leetcode-type *': {
      color: `${leetCodeColors.type} !important`,
    },
    '.cm-leetcode-function, .cm-leetcode-function *': {
      color: `${leetCodeColors.function} !important`,
    },
    '.cm-leetcode-variable, .cm-leetcode-variable *': {
      color: `${leetCodeColors.variable} !important`,
    },
  },
  { dark: true },
)

function hasAncestor(node, name) {
  let current = node.parent
  while (current) {
    if (current.name === name) {
      return true
    }
    current = current.parent
  }
  return false
}

function semanticTokenColor(language, node, text) {
  const parent = node.parent

  if (language === 'Java') {
    if (node.name === 'Definition') {
      if (parent?.name === 'ClassDeclaration') {
        return leetCodeColors.type
      }
      if (
        parent?.name === 'MethodDeclaration'
        || parent?.name === 'ConstructorDeclaration'
      ) {
        return leetCodeColors.function
      }
    }
    if (node.name === 'Identifier' && parent?.name === 'MarkerAnnotation') {
      return leetCodeColors.type
    }
  }

  if (language === 'Python' && node.name === 'VariableName') {
    if (text === 'self') {
      return leetCodeColors.keyword
    }
    if (hasAncestor(node, 'TypeDef')) {
      return leetCodeColors.type
    }
    if (hasAncestor(node, 'ParamList')) {
      return leetCodeColors.variable
    }
    if (parent?.name === 'Decorator') {
      return leetCodeColors.function
    }
  }

  if (language === 'JavaScript') {
    if (node.name === 'VariableDefinition') {
      if (parent?.name === 'ClassDeclaration') {
        return leetCodeColors.type
      }
      if (parent?.name === 'ParamList') {
        return leetCodeColors.variable
      }
      if (
        parent?.name === 'VariableDeclaration'
        && parent.getChild('ArrowFunction')
      ) {
        return leetCodeColors.function
      }
    }
    if (
      node.name === 'PropertyDefinition'
      && parent?.name === 'MethodDeclaration'
    ) {
      return leetCodeColors.function
    }
  }

  if (language === 'C++') {
    if (
      node.name === 'FieldIdentifier'
      && parent?.name === 'FunctionDeclarator'
    ) {
      return leetCodeColors.function
    }
    if (node.name === 'Identifier') {
      if (parent?.name === 'UsingDeclaration' && text === 'std') {
        return leetCodeColors.type
      }
      if (hasAncestor(node, 'ParameterDeclaration')) {
        return leetCodeColors.variable
      }
    }
  }

  return null
}

function semanticColorExtension(language) {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = this.buildDecorations(view)
      }

      update(update) {
        if (update.docChanged) {
          this.decorations = this.buildDecorations(update.view)
        }
      }

      buildDecorations(view) {
        const decorations = []
        syntaxTree(view.state).iterate({
          enter: (ref) => {
            if (ref.node.firstChild) {
              return
            }
            const text = view.state.doc.sliceString(ref.from, ref.to)
            const color = semanticTokenColor(language, ref.node, text)
            if (color) {
              decorations.push(
                Decoration.mark({
                  class: semanticColorClasses.get(color),
                }).range(ref.from, ref.to),
              )
            }
          },
        })
        return Decoration.set(decorations, true)
      }
    },
    {
      decorations: (plugin) => plugin.decorations,
    },
  )
}

export function editorExtensions(language) {
  return [
    EditorState.tabSize.of(4),
    indentUnit.of('    '),
    syntaxHighlighting(
      leetCodeHighlightStyles[language] ?? pythonHighlightStyle,
    ),
    semanticColorExtension(language),
  ]
}

export const editorSetup = {
  lineNumbers: true,
  highlightActiveLineGutter: false,
  foldGutter: false,
  indentOnInput: false,
  bracketMatching: false,
  closeBrackets: true,
  autocompletion: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: true,
  completionKeymap: false,
  foldKeymap: false,
  lintKeymap: false,
  tabSize: 4,
}
