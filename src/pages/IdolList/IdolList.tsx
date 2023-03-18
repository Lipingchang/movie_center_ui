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



type Props = {} & ConnectState;
function IdolList(props: Props) {
  function goPage(pageNum: number, pageSize: number) {
    loadIdolListByMovieCount(pageNum, pageSize).then((_data) => {
  // loadIdolListByPage(pageNum, pageSize).then((_data) => {
      // console.log(_data.docs) // 数据格式
      setIdolList(_data.docs)
      setListTotal(_data.pageinfo.total)
    })
  }
  function queryTheName(name: string) {
    return;
    setMovieListLoading(true)
    loadIdolMovies(name)
      .then(list => setIdolMovieList(list))
      .finally(()=>{
        setMovieListLoading(false)
      })
  }
  async function fuzzyQueryIdolNameIntoOption(_value:string) {
    if (_value.length<=0 || _value.includes('\'')) return;    // 去掉输入法
    let names = await fuzzyQueryIdolName(_value)
    setCompletedIdolNameOptions(names)
  }
  useEffect(() => {
    goPage(10, 5)
    queryTheName('佐藤エル')
  }, [props.dispatch])
  const [idolList, setIdolList] = useState<Array<idolListEleType> | []>([])
  const [idolListTotal, setListTotal] = useState<number>(0)
  // const [queryName, setQueryName] = useState<string>("")
  const [queryDetail, setIdolQuery] = useState<JavbusIdolType>()
  const [idolMovieList, setIdolMovieList] = useState<Array<idolMovieType>>([])
  const [completedIdolNameOptions, setCompletedIdolNameOptions] = useState<Array<{value:string, detail:JavbusIdolType}>>([])
  const [movieListLoading, setMovieListLoading] = useState<boolean>(false);


  return (
    <div>
      <div>
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 4,
            lg: 4,
            xl: 6,
            xxl: 3,
          }}
          bordered
          pagination={{
            onChange: (pageNum: number, pageSize?: number) => {
              goPage(pageNum, pageSize !== undefined ? pageSize : 5)
            },
            total: idolListTotal,
            // showTotal:  (total: number, range: [number,number]) => {return `${range[0]}-${range[1]} of ${total} items`}
            responsive: true,
            defaultPageSize: 5,
          }}
          dataSource={idolList}
          renderItem={(_doc) => {
            // console.log(_doc)
            return (
              <List.Item key={_doc.name} style={{margin:"8px",}}>
                <Button onClick={() => { queryTheName(_doc.name); setIdolQuery(_doc.detail[0]) }}>{_doc.name} Query {_doc.m_count}</Button>
              </List.Item>
            )
          }}
        >
        </List>
      </div>
      <IdolMovieQuery idolDetail={queryDetail}/>
      <div>
        <Typography.Title>Find Idol Presentations:</Typography.Title>
        <Typography.Paragraph>{queryDetail?.name}</Typography.Paragraph>
        {queryDetail?.name ? (<Button onClick={()=>{fetchIdolMetaFromJavbus(queryDetail)}}>爬取javbus {queryDetail?.name} 信息</Button>) : (<></>)}
        <br/>
        <AutoComplete   // 模糊查询偶像名字
          options={completedIdolNameOptions}
          onSearch={fuzzyQueryIdolNameIntoOption}
          onSelect={(value,option)=>{
            // setQueryName()
            // console.log(option.detail)
            setIdolQuery(option.detail)
            queryTheName(value)
          }}
          >
          <Input
            // onSearch={(value,b) => { setQueryName(value);  }}
          />
        </AutoComplete>
        <List
          loading={movieListLoading}
          dataSource={idolMovieList}
          renderItem={(i,num) => {
            return (
              <List.Item
                key={i.serial}
                style={{ justifyContent: 'space-between' }}
              >
                <span>No.{num+1}</span>
                <Typography.Title level={4}>{i.serial}</Typography.Title>
                <img className={styles.MovieListImg} src={`myfile:///cache/javbus_pic_cache/${i.cover}`}></img>
                {/* <Button onClick={()=>{setShowPic(true);setShowPicList(i.sample_pic);console.log(i.sample_pic)}}>load 《{i.sample_pic.length}》sample pic</Button> */}
                {/* {Object.keys(i.diskscan).map(collectionName => {
                  if (i.diskscan[collectionName].length === 0) {
                    return <div key={collectionName}>none</div>
                  } else {
                    return <div key={collectionName}><Button onClick={() => {
                      electron.shell.openPath(i.diskscan[collectionName][0].filePath)
                    }}>Go</Button></div>
                  }
                })} */}
              </List.Item>
            )
          }}></List>
      </div>

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
