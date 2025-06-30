/*
(C) 2025 James Skelley
GNU AFFERO GENERAL PUBLIC LICENSE (with disclaimer addition)

See top-level LICENSE file for terms.

For clarity, in accordance with Item 16 of the AGPL, THIS SOFTWARE IS PROVIDED
BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES,
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

function DATA_TOOLS_is_row_filtered(nm, row){

var fltrs = GROUPS[nm]['FILTERS']
if(fltrs['ROWS'].includes(row['ID']))
  return true;


if(fltrs['APP_TYPE'].includes('Design') && row['Document ID'].includes("D"))
return true;

if(fltrs['APP_TYPE'].includes('Utility') && !row['Document ID'].includes("D"))
return true;


if(fltrs['APP_TYPE'].includes('Utility_Patent') && !row['Document ID'].includes("D") && row['Document ID'].replace(/[AB]\d+/g, '').replace(/\D/g, '').length < 10)
return true;

if(fltrs['APP_TYPE'].includes('Utility_Publication') && !row['Document ID'].includes("D") && row['Document ID'].replace(/\D/g, '').length > 10)
return true;



  var flag = ['CPCI','CPCA','OR','XREF'].some((c)=>{
    return fltrs[c].some((c2)=>{
      if(GROUPS[nm][c+'_SUM'][c2]['MEMBERS'].includes(row['ID']))

    return GROUPS[nm][c+'_SUM'][c2]['MEMBERS'].includes(row['ID'])
    })
  })

  if (flag)
  return true;


  fltrs['DATE'].forEach(f=>{
    if ((new Date(row[f['type']]) < new Date(f['date'])) && f['bound'] == "lower")
    return true
    if ((new Date(row[f['type']]) > new Date(f['date'])) && f['bound'] == "upper")
    return true
})

return false;

}

function DATA_TOOLS_retrieve_filtered_group_rows(){

  var ans = {}
  Object.keys(GROUPS).forEach(k=>{
    if(!GROUPS[k]['PLOT_FLAG'])
    return;

    var g_copy = JSON.parse(JSON.stringify(GROUPS[k]))


var new_arr = []
    g_copy['CSV_ROWS'].forEach((r, ind, arr)=>{
      if (!DATA_TOOLS_is_row_filtered(k, r))
      new_arr.push(r)
    })
g_copy['CSV_ROWS'] = new_arr

    ans[k] = g_copy

  })
return ans;

}

function DATA_TOOLS_get_CPCI_data(group_data){

var ans = []
codes = ["A", "B"]
cnt = 2
codes.forEach((c, i) =>{
  var tmp_ans = {"group":c}
  Object.keys(group_data).forEach(k=>{
    tmp_ans[k] = cnt
    cnt += 1
  })
  ans.push(tmp_ans)
})


return ans

}


function DATA_TOOLS_get_TOTAL_data(group_data){

var ans = []
var codes = ["TOTAL"]
var max_val = 0
codes.forEach((c, i) =>{
  var tmp_ans = {"group":c}
  Object.keys(group_data).forEach(k=>{
    tmp_ans[k] = group_data[k]['CSV_ROWS'].length
    max_val = max_val < tmp_ans[k] ? tmp_ans[k] : max_val
  })
  ans.push(tmp_ans)
})
return {'max': max_val, 'data':ans}

}

function DATA_TOOLS_get_FAMILIES_data(group_data){

var ans = []
var codes = ["FAMILY COUNT"]
var max_val = 0
codes.forEach((c, i) =>{
  var tmp_ans = {"group":c}
  Object.keys(group_data).forEach(k=>{
    var fams = []
group_data[k]['CSV_ROWS'].forEach((r)=>{fams.push(r['Family ID'])})
    tmp_ans[k] = [... new Set(fams)].length
    max_val = max_val < tmp_ans[k] ? tmp_ans[k] : max_val
  })
  ans.push(tmp_ans)
})


return {'max': max_val, 'data':ans}

}



function DATA_TOOLS_get_CODE_data(group_data, code_type,code_level_min, code_level_max, high_low_order, code_max){
var max_val = 0
var ans = []


//BEGIN FIND CODES
var the_codes = {}
Object.keys(group_data).forEach(k=>{
  var codes = group_data[k][code_type+"_SUM"]
  Object.keys(codes).forEach(c=>{
    if(codes[c]["LVL"] > code_level_max || codes[c]["LVL"] < code_level_min)
    return;
    if(!(c in the_codes) || (the_codes[c] < codes[c]['CNT'])){
      the_codes[c] = codes[c]['CNT']
    }
    else if(Math.floor(the_codes[c]) == codes[c]['CNT'])
    the_codes[c] += 0.001
  })
})

the_codes = Object.entries(the_codes)
the_codes.sort((a,b)=> high_low_order > 0 ? b[1] - a[1] : a[1] - b[1])

the_codes.slice(0,code_max).forEach(c =>{
  var tmp_ans = {"group":c[0]}
  Object.keys(group_data).forEach(k=>{
    tmp_ans[k] = c[0] in group_data[k][code_type+"_SUM"] ? group_data[k][code_type+"_SUM"][c[0]]["CNT"] : 0
    max_val = max_val < tmp_ans[k] ? tmp_ans[k] : max_val
  })
  ans.push(tmp_ans)
})
//END FIND CODES

return {'max': max_val, 'data':ans}
}




function DATA_TOOLS_get_CUMULATIVE_data(group_data, plot_type, rng){
var data = []


var [start_date, stop_date] = rng
start_date = start_date.length > 0 ? new Date(start_date) : null
stop_date = stop_date.length > 0 ? new Date(stop_date) : null

Object.keys(group_data).forEach(k=>{
  var tmp = {}
group_data[k]['CSV_ROWS'].forEach(r=>{
  if (r[plot_type] in tmp)
  tmp[r[plot_type]] += 1
  else
  tmp[r[plot_type]] = 1
})



tmp = Object.entries(tmp)
tmp.sort((a,b)=>
  new Date(a[0]) - new Date(b[0]))

  var cnt_group = 0
tmp.forEach(i=>{
  cnt_group += i[1]
  data.push({"date": i[0], "name":k, "n":cnt_group})
})

}
)



data = data.sort((a,b)=> new Date(a['date']) - new Date(b['date']))



if (start_date !== null){
  while(data.length > 0){
    if(new Date(data[0]['date']) < start_date)
    data.shift()
    else
    break;
  }
}

if (stop_date !== null){
  while(data.length > 0){
    if(new Date(data[data.length - 1]['date']) > stop_date)
    data.pop()
    else
    break;
  }
}



return [data, new Date(data[0]['date']), new Date(data[data.length - 1]['date'])]

}


var DATA_TOOLS_make_jdate = function(d){

  return d.getFullYear()+"-"+(d.getMonth()+1).toString().padStart(2,'0')+"-"+d.getDate().toString().padStart(2,'0');

}


function DATA_TOOLS_gen_rows_table(nm){

      var d = $('<div></div>')
      var tabh = $('<div class="group_box_table_holder"></div>')
      var tab = $('<table class="group"></table>')
      tabh.append(tab)
      d.append(tabh)

      var grp = GROUPS[nm]['CSV_ROWS']
      var fltrs = GROUPS[nm]['FILTERS']['ROWS']
      if(grp.length == 0)
      return
      var tr = $('<tr></tr>')
      var kk = ['Filtered?']
      kk.push(...Object.keys(grp[0]))
      kk.forEach(k =>{
        tr.append($('<th>'+k+'</th>'))
      })
      tab.append(tr)
      grp.forEach(o =>{
        tr = DATA_TOOLS_is_row_filtered(nm, o) ? $('<tr style="background-color:#777;"></tr>') : $('<tr style=""></tr>')
        var td = $('<td></td>')
        var checked = !GROUPS[nm]['FILTERS']['ROWS'].includes(o['ID']) ? "checked" : ""
        var inp = $('<input type="checkbox" '+checked+'/>')
        inp.click(((the_row, nnm)=>{
          return ()=>{
            var rows = GROUPS[nm]['FILTERS']['ROWS']
         rows.includes(the_row['ID']) ? GROUPS[nm]['FILTERS']['ROWS'] = rows.filter(i => i !== the_row['ID']) : rows.push(the_row['ID'])
$('#results_container_bottom_body').html('')
$('#results_container_bottom_body').append(DATA_TOOLS_get_filter_ele("ROWS", nnm))
refresh_plot()
}})
(o, nm))
        td.append(inp)
        tr.append(td)
        
        Object.entries(o).forEach(e =>{
          [k,v] = e;
          v= String(v);
          v = v.replaceAll(';', '; ')
          if(k.includes("Document ID"))
            v = '<a target="_blank" href="https://ppubs.uspto.gov/pubwebapp/external.html?q=('+v.replace(/[AB]\d+/g, '').replace(/\D/g, '')+').pn">'+v+'</a>';

            tr.append($('<td>'+v+'</td>'))
        })
        tab.append(tr)
      })
      return d

}


function DATA_TOOLS_create_code_tree(grp_nm, CODE_TYPE){
  var grp = GROUPS[grp_nm]
  var lst = grp[CODE_TYPE]
  var ans = $('<ul></ul>')
  Object.keys(lst).forEach(k =>
{
  lst[k]['ele'] = $('<li>'+lst[k]['CODE']+' ['+lst[k]['CNT']+'] - ('+lst[k]['TEXT']+')</li>')


  var cb = $('<input code="'+lst[k]['CODE']+'" type="checkbox"/>')
  cb.prop('checked', !grp['FILTERS'][CODE_TYPE.replace("_SUM", "")].includes(lst[k]['CODE']))

  cb.click(((me, ele, nm, ctype)=>{
      return () =>{
        var state = me.prop('checked')
        var the_fltr = GROUPS[nm]['FILTERS'][ctype]
          ele.find('input').prop('checked', state).each((ind, o) => {
           state ? the_fltr.splice(the_fltr.indexOf($(o).attr('code')), 1) : the_fltr.push($(o).attr('code'))

});
refresh_plot()
      }
  })(cb, lst[k]['ele'], grp_nm, CODE_TYPE.replace("_SUM", "")))
  lst[k]['ele'].prepend(cb)
})

Object.keys(lst).forEach(k =>
{
if(lst[k]['PARENT_CODE'].length != 0){
  var ele = lst[k]['ele']
  var par_ele = lst[lst[k]['PARENT_CODE']]['ele']
  var the_ul = $('<ul></ul>')
  if (par_ele.find("ul").length == 0){
    par_ele.append(the_ul)
  }else{
    the_ul = $(par_ele.find("ul")[0])
  }
  the_ul.append(ele)
}
})



Object.keys(lst).forEach(k =>
{

if(lst[k]['PARENT_CODE'].length == 0)
  ans.append(lst[k]['ele'])
})

return ans;
}

var DATA_TOOLS_get_filter_ele = function(typ, nm){
var ans = typ.includes("DATE") || typ.includes("ROWS") || typ.includes("APP") ? $('<div>'+typ+'::'+nm+'</div>') : DATA_TOOLS_create_code_tree(nm, typ+'_SUM')
var ans = typ.includes("ROWS") ? DATA_TOOLS_gen_rows_table(nm) : ans


//APP TYPE
if(typ.includes('APP')){
ans = $('<div></div>')
var ul=$('<ul></ul>')
var fltr = GROUPS[nm]['FILTERS']["APP_TYPE"]
ans.append(ul)
var tmp = {'Utility': ['Patent', 'Publication'], 'Design':[]}
for (var k in tmp){
  var li = $('<li>'+k+'</li>')
  ul.append(li)
  var cb = $('<input code="'+k+'" type="checkbox"></input>')
  cb.prop('checked', !fltr.includes(k))
  cb.click(((me, ele, nm, the_fltr)=>{
      return () =>{
        var state = me.prop('checked')
          ele.find('input').prop('checked', state).each((ind, o) => {
           state ? the_fltr.splice(the_fltr.indexOf($(o).attr('code')), 1) : the_fltr.push($(o).attr('code'))
  });

  refresh_plot()
      }
  })(cb, li, nm, fltr))


  li.prepend(cb)
  var ul2 = $('<ul></ul>')
  tmp[k].length > 0 ? li.append(ul2) : "";
  for( var s of tmp[k]){
    var li = $('<li>'+s+'</li>')
        ul2.append(li)
    var cb = $('<input code="'+k+'_'+s+'" type="checkbox"></input>')
    cb.prop('checked', !fltr.includes(k+'_'+s))
    cb.click(((me, ele, nm, the_fltr, cd)=>{
        return () =>{
          var state = me.prop('checked')
          var par = ele.closest('ul').parent().find('input')[0]
          par = $(par)
          var peer = ele.closest('ul').find('input').not('[code="'+cd+'"]')[0]
          peer = $(peer)
          var lst = [me]
          if(!state && !peer.prop('checked')){
            lst.push(par)
            par.prop('checked', false)
          }
          else if(state && !peer.prop('checked')){
            lst.push(par)
            par.prop('checked', true)
          }
          lst.forEach(i=>{
            state ? the_fltr.splice(the_fltr.indexOf(i.attr('code')), 1) : the_fltr.push(i.attr('code'))
          })


    refresh_plot()

        }
    })(cb, li, nm, fltr, k+'_'+s))
    li.prepend(cb)
  }
}

}

return ans

}
