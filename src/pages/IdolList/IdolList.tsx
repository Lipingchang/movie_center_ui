import React, { useReducer, useEffect, useState } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { loadIdolListByPage } from '@/utils/DiskScanDB/dao';
import { Button, List, Typography } from 'antd'
import { JavbusIdolType } from '@/utils/DiskScanDB/bean'

type Props = {} & ConnectState;
function IdolList(props: Props) {
  function goPage(pageNum: number, pageSize: number) {
    loadIdolListByPage(pageNum, pageSize).then((_data) => {
      // console.log(_data.docs) // 数据格式
      setIdolList(_data.docs)
      setListTotal(_data.pageinfo.total)
    })
  }
  function queryTheName(name:string) {

  }
  useEffect(() => {
    goPage(1, 10)
  }, [props.dispatch])
  const [idolList, setIdolList] = useState<Array<JavbusIdolType> | []>([])
  const [idolListTotal, setListTotal] = useState<number>(0)
  const [queryName, setQueryName] = useState<string>("")

  return (
    <div>
      <div>
        <List
          bordered
          pagination={{
            onChange: (pageNum: number, pageSize?: number) => {
              goPage(pageNum, pageSize !== undefined ? pageSize : 10)
            },
            total: idolListTotal,
          }}
          dataSource={idolList}
          renderItem={(_doc) => {
            // console.log(_doc)
            return (
              <List.Item key={_doc.href}>
                <Typography.Text>{_doc.name}</Typography.Text>
                <Button onClick={()=>{queryTheName(_doc.name)}}>Query!</Button>
              </List.Item>
            )
          }}
        >
        </List>
      </div>
      <div>
        <Typography.Title>Find Idol Presentations:</Typography.Title>
      </div>
    </div>
  )
}
export default connect((state: ConnectState) => ({ ...state }))(IdolList);