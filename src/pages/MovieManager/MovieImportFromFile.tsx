import React from "react";
import { connect } from "react-redux";
import { ConnectState } from '@/models/connect';
import { Card, message } from 'antd'
import ScanResultPicker from "../DiskScan/ScanResultPicker";
import { useForm } from "antd/es/form/util";
import Form from "antd/lib/form/Form";
import FormItem from "antd/lib/form/FormItem";
import { loadJavMovieFiles, saveSerialNo } from '@/utils/DiskScanDB/dao'
import Button from "antd/es/button";
import { isUndefined } from "lodash";
import { useState } from "react";
import fakeFs from 'fs'
const fs: typeof fakeFs = window.require('fs')
import fakePath from 'path'
const path: typeof fakePath = window.require('path')
import fakeChildProcess from 'child_process'
import { useEffect } from "react";
const child_process: typeof fakeChildProcess = window.require('child_process')


function MovieImportFromFile(props: ConnectState) {
  const [form] = useForm();
  const [edit_scanresult, setScanResult] = useState<string>("")
  const [jsonFilePath, setJsonFilePaht] = useState<string>("")

  async function saveSerialNoAsJsonFile() {
    // 把isJav为true的文件列表保存到一个json文件中
    // 作为python爬虫的输入
    const _collectionName = form.getFieldValue("edit_scanresult");
    const _files = await loadJavMovieFiles(_collectionName)
    const _serialNoList = _files.map((_file) => {
      return _file.serialNo
    })
    const cwd = fs.realpathSync('.')
    const _jsonPath = path.join(cwd, 'tmp_serialno.json')
    setJsonFilePaht(_jsonPath)
    fs.writeFileSync(_jsonPath, JSON.stringify(_serialNoList))
    console.log(`一共有${_files.length}个文件`)

    // jupyter文件转换成python文件
    const jupyterExePath = path.join(cwd, 'selenium_scraper', 'venv', 'Scripts', 'jupyter.exe')
    const jupyterFilePath = path.join(cwd, 'selenium_scraper', 'step_by_step_test.ipynb')
    child_process.execFileSync(jupyterExePath, ['nbconvert', '--to', 'python', jupyterFilePath]) // 改成异步的?
    console.log('已转换python文件')

    // 运行爬虫文件
    const pythonFilePath = path.join(cwd, 'selenium_scraper', 'venv', 'Scripts', 'python')
    const scraperFilePath = path.join(cwd, 'selenium_scraper', 'step_by_step_test.py')
    const scraper = child_process.spawn(pythonFilePath, [scraperFilePath, '--busstation', '--movie-import-from-file', _jsonPath])
    scraper.stdout?.on('data', (data) => {
      console.log(data.toString())
    })
    scraper.stderr?.on('data', (data) => {
      console.log(data.toString())
    })
    scraper.on('exit', (code) => {
      console.log('exit:', code)
    })

  }

  return (
    <Card title="Movie Import From File">
      <p>选一个扫描结果，找出isJav===true的</p>
      <p>去javbus搜刮他的详细信息</p>
      <Form form={form} onValuesChange={(_changedValues, _values) => {
        setScanResult(_values["edit_scanresult"])
      }}>
        <FormItem name="edit_scanresult">
          <ScanResultPicker />
        </FormItem>
        <Button onClick={() => {
          saveSerialNoAsJsonFile()
        }}>isJav文件保存到文件</Button>
        <p>把{edit_scanresult}中 isJav为true的文件对象的 serialno属性 保存到{jsonFilePath}中 </p>
        <Button onClick={() => {
          ipynb2python()
        }}>ipynb 2 python</Button>
      </Form>
    </Card>
  )
}

export default connect(({ global, settings }: ConnectState) => ({
  collapsed: global.collapsed,
  settings,
}))(MovieImportFromFile)

