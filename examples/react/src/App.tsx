import { AutomergeUrl } from "@automerge/automerge-repo"
import { useDocHandle } from "@automerge/automerge-repo-react-hooks"
import { init } from "@automerge/prosemirror"
// import { exampleSetup } from "prosemirror-example-setup"
import { inputRules, wrappingInputRule, InputRule } from "prosemirror-inputrules"
import { keymap } from "prosemirror-keymap"
import { splitListItem } from "prosemirror-schema-list"
import { baseKeymap } from "prosemirror-commands"
import "prosemirror-example-setup/style/style.css"
import "prosemirror-menu/style/menu.css"
import { EditorState, Transaction } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import "prosemirror-view/style/prosemirror.css"
import { useEffect, useRef } from "react"
import "./App.css"
import { schemaAdapter } from "./schema"

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const editorRoot = useRef<HTMLDivElement>(null)
  const handle = useDocHandle<{ text: string }>(docUrl)

  useEffect(() => {
    let view: EditorView

    if (editorRoot.current != null && handle != null) {
      const { pmDoc, schema, plugin } = init(handle, ["text"], {
        schemaAdapter,
      })
      view = new EditorView(editorRoot.current, {
        state: EditorState.create({
          schema, // It's important that we use the schema from the mirror
          plugins: [
            inputRules({
              rules: [
                wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bulletList),
                wrappingInputRule(
                  /^(\d+)\.\s$/,
                  schema.nodes.orderedList,
                  match => ({ order: +match[1] }),
                  (match, node) =>
                    node.childCount + node.attrs.order == +match[1],
                ),
                new InputRule(/^---$/, (state, match, start, end) => {
                  const tr = state.tr
                  if (match[0]) {
                    tr.replaceWith(start, end, schema.nodes.horizontal_rule.create())
                  }
                  return tr
                }),
              ],
            }),
            keymap({ Enter: splitListItem(schema.nodes.listItem) }),
            keymap(baseKeymap),
            plugin,
          ],
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          doc: pmDoc,
        }),
        dispatchTransaction: (tx: Transaction) => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          view!.updateState(view.state.apply(tx))
        },
      })
    }
    return () => {
      if (view != null) {
        view.destroy()
      }
    }
  }, [editorRoot, handle])

  return <div id="editor" ref={editorRoot}></div>
}

export default App
