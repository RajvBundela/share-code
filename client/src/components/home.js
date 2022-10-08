import React, { useEffect, useState } from 'react'
import AceEditor from 'react-ace'
import axios from 'axios'
import openSocket from 'socket.io-client'
import 'ace-builds/src-noconflict/mode-python'
import 'ace-builds/src-noconflict/mode-c_cpp'
import 'ace-builds/src-noconflict/mode-javascript'
import 'ace-builds/src-noconflict/theme-cobalt'
import 'ace-builds/src-noconflict/ext-language_tools'
import useLocalStorage from '../hooks/useLocalStorage'
import ModalBox from './modalBox'
import '../fonts/JetBrainsMono[wght].ttf'
import './home.css'

var languages = ['python', 'c_cpp', 'javascript']
const socket = openSocket('http://localhost:9000')
const modes = { javascript: 'js', c_cpp: 'cpp', python: 'py' }
const defaultCode = {
  javascript: "console.log('hello rce')",
  c_cpp:
    '#include <iostream>\n\nint main() {\n\tstd::cout << "hello rce";\n\treturn 0;\n}',
  python: "print('hello rce')",
}

const Homepage = () => {
  const [userCode, setUserCode] = useLocalStorage('userCode', '')
  const [mode, setMode] = useLocalStorage('mode', 'python')
  const [code, setCode] = useLocalStorage('code', defaultCode[mode])
  const [input, setInput] = useLocalStorage('input', '')
  // const [userCode, setUserCode] = useState('')
  // const [mode, setMode] = useState('python')
  // const [code, setCode] = useState(defaultCode[mode])
  // const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [joinedSessionCode, setJoinedSessionCode] = useState('')
  const [userID, setUserID] = useState('')
  useEffect(() => {
    if (userCode === '') {
      axios
        .get('http://localhost:9000/code')
        .then(({ data }) => {
          setUserCode(data)
          console.log('thik', data)
        })
        .catch((e) => console.log('error', e))
    }
    const code = `${userCode}-${new Date().getTime()}`
    setUserID(code)
    socket.emit('joinSession', {
      mark: 'usercode',
      channelID: userCode,
      userID: code,
    })
  }, [])

  useEffect(() => {
    console.log(joinedSessionCode)
    // setUserID(`${joinedSessionCode}-${new Date().getTime()}`)
    socket.emit('joinSession', {
      mark: 'koincode',
      channelID: joinedSessionCode,
      userID,
    })
  }, [joinedSessionCode])

  useEffect(() => {
    socket.emit('realtime', {
      userID,
      mode,
      code,
      input,
      output,
    })
  }, [mode, code, input, output])

  const modeHandle = (e) => {
    setCode(defaultCode[e.target.value])
    setMode(e.target.value)
  }

  const handlerun = () => {
    axios
      .post('/code', {
        key: userCode,
        language: modes[mode],
        input: input,
        code: code,
      })
      .then(({ data }) => {
        setOutput(data.toString())
      })
  }

  return (
    <>
      <div className="modal-bg" id="hidden">
        <ModalBox
          userCode={userCode}
          setJoinedSessionCode={setJoinedSessionCode}
        />
      </div>
      <div className="nav">
        <h1 id="brand">
          {' '}
          &gt;codeBox{' '}
          {joinedSessionCode !== '' ? 'joined: ' + joinedSessionCode : ''}
        </h1>
        <div id="navigation">
          {joinedSessionCode !== '' ? (
            <button
              className="nav-btn"
              onClick={() => {
                setJoinedSessionCode('')
              }}
            >
              <h2>disconnect</h2>
            </button>
          ) : (
            <></>
          )}
          <button
            className="nav-btn"
            onClick={() => {
              document.getElementsByClassName('modal-bg')[0].id = ''
            }}
          >
            <h2>session</h2>
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              window.open(
                'https://github.com/nafees87n/remote-code-executor/blob/main/DOCS.md'
              )
            }
          >
            <h2>docs</h2>
          </button>
          <button
            className="nav-btn"
            onClick={() =>
              window.open('https://github.com/nafees87n/remote-code-executor')
            }
          >
            <h2>github</h2>
          </button>
        </div>
      </div>
      <div className="code-region">
        <div id="code-header">
          <h2 className="region-title">code</h2>
          <h2 className="region-title-divider">|</h2>
          <select
            id="language-select"
            defaultValue={mode}
            onChange={modeHandle}
          >
            {languages.map((lang) => {
              return (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              )
            })}
          </select>
          <h2 className="region-title-divider">|</h2>
          <button id="run-btn" onClick={handlerun}>
            RUN
          </button>
        </div>
        <div className="general-editor">
          <AceEditor
            mode={mode}
            theme="cobalt"
            height="100%"
            width="2fr"
            value={code}
            fontSize={18}
            showPrintMargin={false}
            onChange={(val) => setCode(val)}
            name="code_editor"
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
            }}
            highlightActiveLine={joinedSessionCode === '' ? true : false}
            readOnly={joinedSessionCode === '' ? false : true}
          />
        </div>
      </div>
      <div className="input-region">
        <div id="code-header">
          <h2 className="region-title">input</h2>
        </div>
        <div className="general-editor">
          <AceEditor
            mode="text"
            theme="cobalt"
            height="100%"
            width="1fr"
            value={input}
            name="input_editor"
            onChange={(val) => setInput(val)}
            fontSize={18}
            showPrintMargin={false}
            showGutter={false}
            highlightActiveLine={joinedSessionCode === '' ? true : false}
            readOnly={joinedSessionCode === '' ? false : true}
          />
        </div>
      </div>
      <div className="output-region">
        <div id="code-header">
          <h2 className="region-title">output</h2>
        </div>
        <div className="general-editor">
          <AceEditor
            mode="text"
            theme="cobalt"
            height="100%"
            width="1fr"
            value={output}
            name="output_editor"
            fontSize={18}
            showPrintMargin={false}
            showGutter={false}
            highlightActiveLine={false}
            readOnly={true}
          />
        </div>
      </div>
    </>
  )
}

export default Homepage
