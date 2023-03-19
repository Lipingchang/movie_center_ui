import React, { useReducer, useEffect, useState, useRef } from 'react';
import { connect, DispatchProp } from 'dva';
import { ConnectState } from '@/models/connect';
import { fuzzyQueryIdolName, idolMovieType, loadIdolListByPage, loadIdolMovies, loadIdolListByMovieCount, idolListEleType } from '@/utils/DiskScanDB/dao';
import { AutoComplete, Button, Input, List, Typography, Modal, Carousel } from 'antd'
import { JavbusIdolType } from '@/utils/DiskScanDB/bean'
const electron = window.require('electron')
import fakeFs from 'fs'
const fs: typeof fakeFs = window.require('fs')
import fakePath from 'path'
const path: typeof fakePath = window.require('path')
import fakeChildProcess from 'child_process'
const child_process: typeof fakeChildProcess = window.require('child_process')
import styles from './IdolList.less'
import IdolMovieQuery from './IdolMovieQuery';
import FuzzyQueryIdolName from './FuzzyQueryIdolName';
const DefaultPageSize = 20

type Props = {} & ConnectState;
function IdolList(props: Props) {
  function goPage(pageNum: number, pageSize: number) {
    loadIdolListByMovieCount(pageNum, pageSize).then((_data) => {
      console.log(_data) // 数据格式
      setIdolList(_data.docs)
      setListTotal(_data.pageinfo.total)
    })
  }

  useEffect(() => {
    goPage(1, DefaultPageSize)
  }, [props.dispatch])
  const [idolList, setIdolList] = useState<Array<idolListEleType> | []>([])
  const [idolListTotal, setListTotal] = useState<number>(0)
  // const [queryName, setQueryName] = useState<string>("")
  const [queryDetail, setIdolQuery] = useState<JavbusIdolType>()
  // const [idolMovieList, setIdolMovieList] = useState<Array<idolMovieType>>([])
  // const [movieListLoading, setMovieListLoading] = useState<boolean>(false);

  return (
    <div>
      <div style={{border: "1px black solid", padding: "3px"}}>
        <Typography.Title level={2}>1. Select a Idol: {queryDetail?.name}</Typography.Title>
        <FuzzyQueryIdolName // 模糊查询idol名字
          onSelect={(name, detail)=>{
            setIdolQuery(detail)
          }} />
        {queryDetail?.name ? 
          (<Button 
            type='primary' 
            onClick={()=>{fetchIdolMetaFromJavbus(queryDetail)}}>
              py 爬取javbus {queryDetail?.name} 信息
          </Button>) : 
          (<></>)
        }
        <br/>
        <List       // 按照出场次数 显示idol列表
          grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 3, }}
          pagination={{
            onChange: (pageNum: number, pageSize?: number) => {
              goPage(pageNum, pageSize ? pageSize : DefaultPageSize)
            },
            onShowSizeChange: goPage,
            total: idolListTotal,
            // showTotal:  (total: number, range: [number,number]) => {return `${range[0]}-${range[1]} of ${total} items`}
            responsive: true,
            defaultPageSize: DefaultPageSize,
          }}
          dataSource={idolList}
          renderItem={(_doc) => {
            // console.log(_doc)
            return (
              <List.Item key={_doc.name} style={{margin:"8px",}}>
                <Button onClick={() => { setIdolQuery(_doc.detail[0]) }}>{_doc.name} Query {_doc.m_count}</Button>
              </List.Item>
            )
          }}
        >
        </List>
      </div>
      <Typography.Title level={2}>2. Find Idol Presentations:</Typography.Title>
      {/* 查找这个名字的 电影列表 */}
      <IdolMovieQuery idolDetail={queryDetail}/>  
    </div >
  )


  function fetchIdolMetaFromJavbus(idol: any){
    console.log('fetch idol:', idol)
    let idol_id = idol?.href.split('/').pop()
    const cwd = fs.realpathSync('.')

    // jupyter文件转换成python文件
    const jupyterExePath = path.join(cwd, 'selenium_scraper', 'venv', 'Scripts', 'jupyter.exe')
    const jupyterFilePath = path.join(cwd, 'selenium_scraper', 'step_by_step_test.ipynb')
    child_process.execFileSync(jupyterExePath, ['nbconvert', '--to', 'python', jupyterFilePath]) // 改成异步的?
    console.log('jupyter转换python文件 -ok')

    // 运行爬虫文件
    const pythonFilePath = path.join(cwd, 'selenium_scraper', 'venv', 'Scripts', 'python')
    const scraperFilePath = path.join(cwd, 'selenium_scraper', 'step_by_step_test.py')
    const scraper = child_process.spawn(pythonFilePath, [scraperFilePath, '--busstation', '--scrap-idol', idol_id])
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

}
export default connect((state: ConnectState) => ({ ...state }))(IdolList);
