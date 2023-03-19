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

type Props = {
  onSelect: (name:string, detail: JavbusIdolType)=>void;
} & ConnectState;
function FuzzyQueryIdolName(props: Props) {
  const [completedIdolNameOptions, setCompletedIdolNameOptions] = useState<Array<{value:string, detail:JavbusIdolType}>>([])
  async function fuzzyQueryIdolNameIntoOption(_value:string) {
    if (_value.length<=0 || _value.includes('\'')) return;    // 去掉输入法
    let names = await fuzzyQueryIdolName(_value)
    setCompletedIdolNameOptions(names)
  }

  return (
    <AutoComplete   // 模糊查询偶像名字
      placeholder="Fuzzy Query.."
      options={completedIdolNameOptions}
      onSearch={fuzzyQueryIdolNameIntoOption}
      onSelect={(value,option)=>{
        props.onSelect(value, option.detail)
        // console.log('fuzzy query idol name return: ', value, option.detail)
        // setQueryName()
        // console.log(option.detail)
        // setIdolQuery(option.detail)
        // queryTheName(value)
      }}
      >
        <Input
          // onSearch={(value,b) => { setQueryName(value);  }}
      />
    </AutoComplete>
  )
}

export default connect((state: ConnectState) => ({ ...state }))(FuzzyQueryIdolName);
