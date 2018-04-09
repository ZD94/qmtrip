日期：<%=moment(tripApprove.startAt).format('YYYY.MM.DD') || '' %> 至 <%=moment(tripApprove.backAt).format('YYYY.MM.DD') || '' %><br/>
行程：<%=tripApprove.deptCity || '' %> <%=(tripApprove.deptCity) ? '-' : ''%> <%=tripApprove.arrivalCity || '' %><br/>
预算：￥<%=tripApprove.budget || '' %>