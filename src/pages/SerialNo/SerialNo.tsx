import React, { useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Form, Input, message, Radio, Spin } from 'antd';
import ScanResultPicker from '@/pages/DiskScan/ScanResultPicker';
import Button from 'antd/es/button';
import { findSameFilename, loadMovieFiles, saveSerialNo } from '@/utils/DiskScanDB/dao'
import { MovieRecordType, SingleFileType } from '@/utils/DiskScanDB/bean';
import styles from './SerialNo.less';
import { CheckCircleTwoTone, CloseCircleTwoTone, CodeSandboxCircleFilled, SaveTwoTone } from '@ant-design/icons';
import { isUndefined } from 'lodash';
const electron = window.require('electron')
const useForm = Form.useForm;
const defaultSeqareor = "-"
const notJavSerials = ['欧美', '国产', 'Jav素人', '未知'];

type Props = {} & ConnectState;
export type _SingleFileType = {
  serialNoSet: boolean;// 存数据库中有无设置过serial，有无人工审核过番号的正确性？自动的是正则匹配出来的
  key: string;        // 用来存mongo的_id
  isEdited: boolean;  // 在客户端中有无修改/有无点过cache，有的话在save to db的时候就要保存
} & SingleFileType;
function SerialNo(props: Props) {
  /**
   * form Fields 解释
   * cName 往期扫描结果单选栏中选一个collection
   * regex 用来匹配文件名中番号的正则表达式
   * 
   */

  const [form] = useForm();// 中间编辑区域的输入框
  const [workingCollectionName, setC] = useState<string>(""); // 保存当前的文件来自哪一个collection
  const [movieFileList, setMovieList] = useState<Array<_SingleFileType>>([]);// 左侧选择文件区域的列表
  const [selectedMovieItem, setSelected] = useState<number>(-1)// 正在编辑的文件在列表中的下标
  const [editMovieItem, _setEditMovieItem] = useState<_SingleFileType | undefined>(undefined); // 正在编辑的文件对象的引用
  const [editJavMode, setEditJavMode] = useState(false) // 这个input能不能被编辑 当他是 not jav 时，要手动编辑id，同时serial变为av的大类
  const [idOptions, setIdOptions] = useState<Array<string>>([]) // 文件名中能匹配出多个番号时, 显示多个匹配结果
  const [loading, setLoading] = useState<boolean>(false)

  function setEditMovieItem(item: _SingleFileType | undefined) {
    _setEditMovieItem(item)

    if (item !== undefined) {
      form.setFieldsValue({
        edit_id: item.serialNo.id,
        edit_no: item.serialNo.no,
        edit_seq: item.serialNo.seqarator,
        edit_serial: item.serialNo.serial,
        edit_isJav: item.isJav,
      })
      // 文件名中匹配出多个番号
      const regex = form.getFieldValue("regex")
      const { fileName } = item
      const idRegex = new RegExp(regex, "g")
      const ids = fileName?.match(idRegex)
      setIdOptions(ids ? ids : [])
      setEditJavMode(item.isJav)
    }
  }

  // 装载对应的电影文件列表  把 SingleFileType => MovieRecordType??//??SingleFileType
  const loadMovies = async () => {
    const { cName, regex } = form.getFieldsValue();
    setC(cName)
    const idRegex = new RegExp(regex);
    const movieFiles: Array<SingleFileType> = await loadMovieFiles(cName)
    console.log('电影文件 列表', movieFiles);
    // 匹配每个movie的内容, 把 SingleFileType => MovieRecordType
    const movieRecords: Array<_SingleFileType> = movieFiles.map(file => {
      const idResult = idRegex.exec(file.fileName)
      const ret: _SingleFileType = {
        serialNoSet: true,// 已经识别过的标志
        key: file._id.toHexString(),
        isJav: true,
        isEdited: false,
        ...file
      }
      if (file.serialNo.id !== undefined) {
        // 如果文件信息中的serialNo字段的属性不为空，就说明以前被编辑和保存过了（已经被手工识别和保存过了），就加载原先编辑的内容
        return ({
          ...ret,
          serialNoSet: true,
          isJav: file.isJav,
        })
      }
      if (idResult === null) { // 没有匹配成功
        return ({
          ...ret,
          serialNoSet: false,
        })
      } else { // 匹配成功
        let [id, serial, seqarator, no] = idResult;
        serial = serial.toUpperCase()
        return {
          ...ret,
          serialNoSet: false,
          serialNo: {
            id: `${serial}${defaultSeqareor}${no}`,
            seqarator,
            serial,
            no,
          }
        }
      }
    })
    console.log('movieRecords', movieRecords)
    setMovieList(movieRecords)
    setSelected(-1);
    setEditMovieItem(undefined)
  }

  const filterMovies = () => {
    const _list = movieFileList.filter((_file) => {
      return !_file.serialNoSet
    })
    setMovieList(_list)
  }

  function jumpNext(index?: number) {
    if (index == undefined) {
      index = selectedMovieItem < movieFileList.length - 1 ? selectedMovieItem + 1 : selectedMovieItem;
    }
    setSelected(index)
    setEditMovieItem(movieFileList[index])
  }

  function cache() {
    const { edit_id, edit_serial, edit_no, edit_seq, edit_isJav } = form.getFieldsValue();
    // const id = `${edit_serial}${defaultSeqareor}${edit_no}`
    movieFileList[selectedMovieItem].serialNo.id = edit_id
    movieFileList[selectedMovieItem].serialNo.serial = edit_serial
    movieFileList[selectedMovieItem].serialNo.no = edit_no
    movieFileList[selectedMovieItem].serialNo.seqarator = edit_seq
    movieFileList[selectedMovieItem].isJav = edit_isJav
    movieFileList[selectedMovieItem].isEdited = true
    jumpNext()
  }
  function upperCase() {
    let { edit_serial, edit_no } = form.getFieldsValue();
    edit_serial = edit_serial.toUpperCase()
    edit_no = edit_no.toUpperCase()
    const id = `${edit_serial}${defaultSeqareor}${edit_no}`
    form.setFieldsValue({
      edit_serial,
      edit_no,
      edit_id: id
    })
  }
  function saveMovies() {
    // 把 审核好/isEdited为true 的数据保存回 diskscan 的表中去
    if (workingCollectionName !== '') {
      const _list = movieFileList.filter((_file) => {
        return _file.isEdited
      })
      saveSerialNo(workingCollectionName, _list)
        .then((_okCount) => {
          message.success(`成功个数:${_okCount},总共:${_list.length}`)
        })
    } else {
      message.error('要先选一个扫描结果')
    }
  }
  function resetId(id: string) { // 文件名中出现多个匹配正则的番号后，选择其他番号，把其他番号的信息放入form中
    const regex = form.getFieldValue("regex")
    const idRegex = new RegExp(regex);
    const idResult = idRegex.exec(id)
    let [_, serial, seqarator, no] = idResult;
    serial = serial.toUpperCase();
    no = no.toUpperCase();
    form.setFieldsValue({
      edit_id: `${serial}${defaultSeqareor}${no}`,
      edit_serial: serial,
      edit_seq: seqarator,
      edit_no: no,
    })
  }
  async function syncSerialNoFromOldScan() {
    setLoading(true)
    for (let i = 0; i < movieFileList.length; i++) {
      if (movieFileList[i].serialNoSet) { // 如果这个文件被审核过
        continue;
      }
      const otherFiles = await findSameFilename(movieFileList[i].fileName)
      let _f; // 缓存之前审核过的file信息
      let find = false;
      otherFiles.map(f => {
        if (f.serialNo.id !== undefined) { // 如果其他同名文件的serialno是编辑过的
          _f = f
          find = true
        }
      })
      if (find) {
        console.log(_f)
        movieFileList[i].serialNo = _f.serialNo
        movieFileList[i].isJav = _f.isJav
        movieFileList[i].isEdited = true
      }
    }
    setLoading(false)
  }

  return (
    <>
      <PageHeaderWrapper>
        <Card title="SerialNo Picker">
          <Form form={form}
            onSubmitCapture={loadMovies}
          >
            <Form.Item label="pick" name="cName" rules={[{ required: true }]}>
              <ScanResultPicker />
            </Form.Item>
            <Form.Item
              label="regex"
              name="regex"
              rules={[{ required: true }]}
              initialValue={"([0-9]*[a-zA-Z]*)([-\s_]?)([0-9]+)"}
            >
              <Input />
            </Form.Item>
            <Button htmlType="submit">start</Button>
          </Form>
        </Card>
        <Spin spinning={loading}>
          <Card>
            <h1>当前collection: {workingCollectionName}</h1>
            <div className={styles.boxtitle}>
              <div className={styles.left}>选择文件
                <Button onClick={() => { filterMovies() }}>显示未审核</Button>
                <Button onClick={() => { syncSerialNoFromOldScan() }}>复制老扫描同名文件结果到本扫描中</Button>
              </div>
              <div className={styles.right}>设置文件文件对应的番号</div>
            </div>
            <div className={styles.box}>
              {/* 列表 */}
              <div className={styles.left}>
                {movieFileList.map((item, index) => (
                  <div
                    className={`${styles.item} ${selectedMovieItem === index ? styles.select : ""}`}
                    key={item.key}
                    // onClick={() => { setSelected(index); setEditMovieItem(movieFileList[index]) }}>
                    onClick={() => { jumpNext(index) }}>
                    {item.serialNoSet == true ?
                      <div className={styles.modifyTag}><CheckCircleTwoTone twoToneColor="green" /><span>已审</span></div> :
                      <div className={styles.modifyTag}><CloseCircleTwoTone twoToneColor="red" /><span>未审</span></div>
                    }
                    {
                      item.isEdited == true ?
                        <div><SaveTwoTone twoToneColor="green" /></div> :
                        <div><SaveTwoTone twoToneColor="red" /></div>
                    }
                    {item.fileName}
                  </div>
                ))}
              </div>
              {/* 内容 */}
              <div className={styles.right}>
                {editMovieItem === undefined ? <div></div> :
                  <div>
                    <h1>{editMovieItem.fileName}</h1>
                    <Form form={form}
                      onValuesChange={(_changedValues, _values) => {
                        // 手动修改番号的serial和no的时候 联动 修改id
                        if (
                          _values['edit_isJav']
                          && (!isUndefined(_changedValues['edit_serial']) || !isUndefined(_changedValues['edit_no']))
                        ) {
                          const _id = `${_values['edit_serial']}${defaultSeqareor}${_values['edit_no']}`
                          form.setFieldsValue({
                            'edit_id': _id
                          })
                        }
                        // 当前影片种类改变
                        if (!isUndefined(_changedValues['edit_isJav'])) {
                          const _isJav = _changedValues['edit_isJav']
                          setEditJavMode(_isJav)  // 要改变form的编辑格式
                          if (!_isJav) { // 不是jav的话 把id改成文件名
                            form.setFieldsValue({
                              'edit_id': editMovieItem.fileName,
                              edit_serial: notJavSerials[0],  // 默认选第一个serial
                              edit_no: '',
                            })
                          } else {
                            resetId(idOptions[0])
                          }
                        }

                      }}>
                      <Form.Item label="Name(id)" name="edit_id"><Input disabled={editJavMode} /></Form.Item>
                      {(editJavMode) ?
                        (<Form.Item label="Serial" name="edit_serial"><Input /></Form.Item>)
                        : (   // 不是jav的影片的serial要固定选择一个
                          <Form.Item label="Serial" name="edit_serial">
                            <Radio.Group>
                              {notJavSerials.map((_serial) => {
                                return (
                                  <Radio key={_serial} value={_serial}>{_serial}</Radio>
                                )
                              })}
                            </Radio.Group>
                          </Form.Item>
                        )
                      }
                      <Form.Item label="No." name="edit_no"><Input /></Form.Item>
                      <Form.Item label="Found Seqareor" name="edit_seq"><Input disabled /></Form.Item>
                      <Form.Item label="Is Jav?" name="edit_isJav">
                        <Radio.Group>
                          <Radio value={false}>Not Jav</Radio>
                          <Radio value={true}>Jav</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Form>
                    <div className={styles.operator}>
                      <Button onClick={() => { jumpNext() }}>下一个</Button>
                      <Button onClick={() => { upperCase() }}>Upper Case</Button>
                      {/* <Button onClick={() => { notJav() }}>Not JAV</Button> */}
                      <Button onClick={() => { cache() }} type="primary">Cache</Button>
                    </div>
                    <div className={styles.regexOtherOption}>
                      其他匹配项：
                      {idOptions.map((id, index) => {
                        return <Button size="small" type="dashed" key={index} onClick={() => { resetId(id) }}>{id}</Button>
                      })}
                    </div>
                    <div>
                      <Button onClick={() => {
                        electron.shell.openPath(editMovieItem.filePath)
                      }}>Watch</Button>
                    </div>
                  </div>}
              </div>
              <Button onClick={() => { saveMovies() }}>保存审核结果</Button>
            </div>
          </Card>
        </Spin>
      </PageHeaderWrapper>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(SerialNo);
