'''
(C) 2025 James Skelley
GNU AFFERO GENERAL PUBLIC LICENSE (with disclaimer addition)

See top-level LICENSE file for terms.

For clarity, in accordance with Item 16 of the AGPL, THE COPYRIGHT HOLDER OR ANY
OTHER PARTY WHO MODIFIES AND/OR CONVEYS THE PROGRAM AS PERMITTED ABOVE, PROVIDES
THE PROGRAM ON AN "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
EITHER EXPRESS OR IMPLIED, INCLUDING, WIHTOUT LIMITATION, ANY WARRANTIES OR
CONDITIONS OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY, OR FITNESS FOR A PARTICULAR
PURPOSE.  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
'''

from bs4 import BeautifulSoup
import os
import shutil
import glob
import tarfile
import zipfile
import sqlite3
from datetime import datetime
import sys
import re
import csv



sqlConn = 0
sqlite_cur = 0

entry_template = {
'ID':'',
'Document ID': '',
'Date Published': '',
'Family ID': '',
#'Pages': '',
'Title': '',
'CPCI': '',
'CPCA': '',
'Inventor': '',
'Assignee': '',
'Application Number': '',
'Filing Date': '',
#'Primary Examiner': '',
#'Assistant Examiner': '',
'OR': '',
'XREF': '',
'Applicant Name': '',
'Domestic Priority':'',
'Foreign Priority':''
}



TEMPLATES = {
"CPC_INDEX": {
'ID': 'integer primary key AUTOINCREMENT',
'CODE': 'varchar(25) UNIQUE',
'TEXT': 'varchar(255)',
'PARENT_CODE': 'varchar(25)',
#'parent_id': 'integer'
},
"DESIGN_INDEX": {
'ID': 'integer primary key AUTOINCREMENT',
'CODE': 'varchar(25) UNIQUE',
'TEXT': 'varchar(255)',
'PARENT_CODE': 'varchar(25)'
}
}

sqlite_cur = ""
sqlConn = ""

def init_codes_db():
    global sqlConn, sqlite_cur, TEMPLATES
    try:
        sqlConn = sqlite3.connect('sql_codes.db')
        sqlConn.row_factory = sqlite3.Row
        sqlite_cur = sqlConn.cursor()

    except sqlite3.Error as error:
        print('Error occurred - ', error)
    finally:
        pass
        #if sqlConn:
        #    sqlConn.close()


def select_sql(table, where_dic):
    global sqlite_cur, sqlConn
    sql = "SELECT * FROM " + table + "  WHERE " + ' AND '.join(f"{key} = ?" for key in where_dic)


    try:
        sqlite_cur.execute(sql,tuple(where_dic.values()))
        rows = sqlite_cur.fetchall()
        sqlConn.commit()
        return rows
    except sqlite3.IntegrityError as e:
            return -1

def get_code_upstream(db, code, ans):
    rows = select_sql(db, {'CODE':code})
    d = dict(rows[0])
    ans[d['CODE']] = d
    if len(d['PARENT_CODE']) > 0:
        get_code_upstream(db, d['PARENT_CODE'], ans)

def get_code(db, code):
    rows = select_sql(db, {'CODE':code})
    return dict(rows[0])

def code_break(val, db):
    tmp = []
    for val in val.split(';'):
        if "D" in val and len(val.split('/')[0]) < 3:
            val = "D0" + val[1:]
        ans = {}
        get_code_upstream(db, val, ans)
        tmp = tmp + list(ans.keys())
    return list(set(ans.keys()))



def process_csv(f):
    ans = []
    CPCI_SUM, CPCA_SUM, OR_SUM, XREF_SUM = ({}, {}, {},{})
    id_cnt = 0
    with open(f, mode='r') as fl:
        dr = csv.DictReader(fl)
        data = [row for row in dr]
        for d in data:
            t = dict.fromkeys(entry_template)
            id_cnt += 1
            t['ID'] = id_cnt
            for key, val in d.items():
                if key in t.keys():
                    t[key] = val
                    if key in ["CPCI", "CPCA"]:
                        if len(val) == 0:
                            continue
                        SUM = CPCA_SUM
                        if key == "CPCI":
                            SUM = CPCI_SUM
                        TMP = {}
                        for tt in code_break(val, 'CPC_INDEX'):
                            TMP[tt] = 1
                        for tt in TMP.keys():
                            if tt in SUM.keys():
                                SUM[tt]['CNT'] += 1
                                SUM[tt]['MEMBERS'].append(t['ID'])
                            else:
                                c = get_code('CPC_INDEX', tt)
                                c.update({'CNT':1})
                                c.update({'MEMBERS':[]})
                                c['MEMBERS'].append(t['ID'])
                                tmp = {}
                                get_code_upstream('CPC_INDEX', tt, tmp)
                                c.update({'LVL':len(tmp)})
                                SUM[tt] = c
                    if key in ["OR", "XREF"]:
                            if len(val) == 0 or not "D" in val:
                                continue
                            SUM = OR_SUM
                            if key == "XREF":
                                SUM = XREF_SUM
                            TMP = {}
                            for tt in code_break(val, 'DESIGN_INDEX'):
                                TMP[tt] = 1
                            for tt in TMP.keys():
                                if tt in SUM.keys():
                                    SUM[tt]['CNT'] += 1
                                    SUM[tt]['MEMBERS'].append(t['ID'])
                                else:
                                    c = get_code('DESIGN_INDEX', tt)
                                    c.update({'CNT':1})
                                    c.update({'MEMBERS':[]})
                                    c['MEMBERS'].append(t['ID'])
                                    tmp = {}
                                    get_code_upstream('DESIGN_INDEX', tt, tmp)
                                    c.update({'LVL':len(tmp)})
                                    SUM[tt] = c


            ans.append(t)

    return dict(zip(["CSV_ROWS", 'CPCI_SUM', 'CPCA_SUM', 'OR_SUM', 'XREF_SUM'], [ans, CPCI_SUM, CPCA_SUM, OR_SUM, XREF_SUM]))




init_codes_db()
