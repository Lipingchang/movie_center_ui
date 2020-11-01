import React, { useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { Card, Form, Input } from 'antd';
import ScanResultPicker from '@/pages/DiskScan/ScanResultPicker';
import Button from 'antd/es/button';
import { loadMovieFiles } from '@/utils/DiskScanDB/dao'
import { MovieRecordType, SingleFileType } from '@/utils/DiskScanDB/bean';
import styles from './SerialNo.less';
const useForm = Form.useForm;

type Props = {} & ConnectState;
function SerialNo(props: Props) {
  const [form] = useForm();
  const [movieList, setMovieList] = useState<Array<MovieRecordType>>([]);
  const [selectedMovieItem, setSelected] = useState<number>(-1)
  const [editMovieItem, _setEditMovieItem] = useState<MovieRecordType>(undefined);

  function setEditMovieItem(item: MovieRecordType) {
    _setEditMovieItem(item)

    if (item !== undefined) {
      form.setFieldsValue({
        edit_id: item.serialNo.id,
        edit_no: item.serialNo.no,
        edit_sep: item.serialNo.seqarator,
        edit_serial: item.serialNo.serial,
      })
    }
  }
  const loadMovies = async () => {
    const { cName, regex } = form.getFieldsValue();
    const idRegex = new RegExp(regex);
    const movieFiles: Array<SingleFileType> = await loadMovieFiles(cName)
    console.log('movieFiles', movieFiles);
    // 匹配每个movie的内容
    const movieRecords: Array<MovieRecordType> = movieFiles.map(file => {
      const idResult = idRegex.exec(file.fileName)
      if (idResult === null) {
        return ({
          filename: file.fileName,
          key: file._id.toHexString(),
          serialNo: {
            id: "",
            seqarator: "",
            serial: "",
            no: "",
          },
          detail: {
            cover: '',
            actor: [],
          },
          scanResult: [{
            collectionName: cName,
            path: file.filePath,
            id: file._id,
          }],
        })
      } else {
        let [id,  serial, seqarator, no ]= idResult;
        const defaultSeqareor = "-"
        return ({
          filename: file.fileName,
          key: file._id.toHexString(),
          serialNo: {
            id: `${serial}${defaultSeqareor}${no}`,
            seqarator,
            serial,
            no,
          },
          detail: {
            cover: '',
            actor: [],
          },
          scanResult: [{
            collectionName: cName,
            path: file.filePath,
            id: file._id,
          }],
        })
      }
    })
    console.log('movieRecords', movieRecords)
    setMovieList(movieRecords)
    setSelected(-1);
    setEditMovieItem(undefined)
  }

  function jumpNext() {

  }

  function jumpPre() {

  }

  function cache() {

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
              initialValue={"([0-9]*[a-zA-Z]+)([-\s]?)([0-9]+)"}
            >
              <Input />
            </Form.Item>
            <Button
              htmlType="submit"
            // onClick={() => {
            // loadMovies();
            // 获取选择的collection
            // 过滤isMovie的选项
            // 对每个选项进行匹配 然后人工确认
            // 把匹配结果保存到新的collection中 关联到scanResult中
            // }}
            >start</Button>
          </Form>
        </Card>
        <Card>
          <div className={styles.box}>
            {/* 列表 */}
            <div className={styles.left}>
              {movieList.map((item, index) => (
                <div
                  className={`${styles.item} ${selectedMovieItem === index ? styles.select : ""}`}
                  key={item.key}
                  onClick={() => { setSelected(index); setEditMovieItem(movieList[index]) }}>
                  {item.filename}
                </div>
              ))}
            </div>
            {/* 内容 */}
            <div className={styles.right}>
              {editMovieItem === undefined ? <div></div> :
                <div>
                  <h1>{editMovieItem.filename}</h1>
                  <Form form={form}>
                    <Form.Item label="Name(id)" name="edit_id"><Input /></Form.Item>
                    <Form.Item label="Serial" name="edit_serial"><Input /></Form.Item>
                    <Form.Item label="No." name="edit_no"><Input /></Form.Item>
                    <Form.Item label="Seqareor" name="edit_sep"><Input /></Form.Item>
                  </Form>
                  <div className={styles.operator}>
                    <Button>Upper Case</Button>
                    <Button onClick={()=>{jumpPre()}}>上一个</Button>
                    <Button onClick={()=>{jumpNext()}}>下一个</Button>
                    <Button onClick={()=>{cache()}} type="primary">Cache</Button>
                  </div>
                </div>}
            </div>
            <Button>Save To DB</Button>
          </div>
        </Card>
      </PageHeaderWrapper>
    </>
  );
}

export default connect((state: ConnectState) => ({ ...state }))(SerialNo);
