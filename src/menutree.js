/**
 * 基于tree实现menutree 
 */
(function ($) {
    $.parser.plugins.push('menutree');

    function create(ele){
        var p=$('<div class="menutree-wrap"><div class="menutree-collapse-wrap"></div><div class="menutree-searchbox-wrap"></div><div class="menutree-tree-wrap"></div></div>').insertAfter(ele);
        p.panel({ doSize: false,border:false ,onResize:function(w,h){
            setTimeout(function(){
                resizeItem(ele,{width:w,height:h})
            },0)
            
        }});
        p.panel("panel").addClass("menutree").bind("_resize", function (e, arg) {
            var opts = $.data(ele, "menutree").options;
            if (opts.fit == true || arg) {
                resize(ele);
            }
            return false;
        });

        var sp = $('<div class="menutree-wrap"><div class="menutree-tree-wrap"></div></div>').appendTo('body');
        sp.panel({
            doSize: false, closed: true, border:false ,cls: "menutree menutree-sp", style: { position: "absolute", zIndex: 10 }, onOpen: function () {
                var p = $(this).panel("panel");
                if ($.fn.menu) {
                    p.css("z-index", $.fn.menu.defaults.zIndex++);
                } else {
                    if ($.fn.window) {
                        p.css("z-index", $.fn.window.defaults.zIndex++);
                    }
                }
                $(this).panel("resize");
            }, onBeforeClose: function () {

            }, onClose: function () {
                var state = $.data(ele, "menutree");
                if(state && state._isClickShowSub) {
                    state._isClickShowSub=false;
                }

                if(state.panel) {
                    state.panel.find('.menutree-root-hover').removeClass('menutree-root-hover');
                }

            }
        });

        $(document).off(".menutree").on("mousedown.menutree", function (e) {
            var p = $(e.target).closest("div.menutree-sp");
            if (p.length) {
                return;
            }
            if($('.menutree-sp:visible').length>0) {
                $('.menutree-sp>.menutree-wrap:visible').panel('close');
            }
        })


        return {panel:p,subpanel:sp};
    };
    function resize(ele, size) {
        var opts = $.data(ele, "menutree").options;
        var panel = $.data(ele, "menutree").panel;
        if (size) {
            if (size.width) {
                opts.width = size.width;
            }
            if (size.height) {
                opts.height = size.height;
            }
        }
        if (opts.fit == true) {
            var p = panel.panel("panel").parent();
            if(!opts.collapsed) {  //收缩状态不进行宽度计算
                opts.width = p.width();
            }
            opts.height = p.height();
        }
        if (opts.collapsed) {
            panel.panel("resize", { height: opts.height });  //收缩状态不重新resize宽度
        }else{
            panel.panel("resize", { width: opts.width, height: opts.height });
        }
        
        
    };
    function resizeItem(ele){
        var opts = $.data(ele, "menutree").options;
        var panel = $.data(ele, "menutree").panel;
        var cw=panel.find('.menutree-collapse-wrap');
        var sw=panel.find('.menutree-searchbox-wrap');
        var tw=panel.find('.menutree-tree-wrap');
        var s=sw.find('.menutree-searchbox');
        if(s.length>0) s.searchbox('resize',opts.width);
        var treeHeight=opts.height-(tw.offset().top-tw.parent().offset().top);
        tw._outerHeight(treeHeight);


    }
    function setCollapse(ele){
        var opts = $.data(ele, "menutree").options;
        var panel = $.data(ele, "menutree").panel;
        var cw=panel.find('.menutree-collapse-wrap');
        var c=cw.find('.menutree-collapse');
        if(c.length==0) {
            c=$('<span class="menutree-collapse menutree-expanded"></span>').appendTo(cw);
            c.on('click',function(){
                if($(this).hasClass('menutree-expanded')) { //当前为展开状态
                    $(this).removeClass('menutree-expanded');

                    panel.panel('panel').addClass('menutree-min');
                    panel.panel('resize',{width:opts.minwidth});

                    $(this).addClass('menutree-collapsed');
                    opts.collapsed=true;
                    opts.onPanelCollapse.call(ele,opts.minwidth) //向左折叠

                }else if($(this).hasClass('menutree-collapsed')){ //当前为折叠状态
                    $(this).removeClass('menutree-collapsed');
                    panel.panel('panel').removeClass('menutree-min');
                    panel.panel('resize',{width:opts.width});
                    $(this).addClass('menutree-expanded');
                    opts.collapsed=false;
                    opts.onPanelExpand.call(ele,opts.width) //向右展开
                }



            })
        }
       
        if(opts.collapsible){
            cw.removeClass('menutree-hidden');
        }else{
            cw.addClass('menutree-hidden');
        }
    }
    function setSearchbox(ele){
        var state=$.data(ele, "menutree")
        var opts = state.options;
        var panel = state.panel;
        var sw=panel.find('.menutree-searchbox-wrap');
        var s=sw.find('.menutree-searchbox');
        if(s.length==0) {
            s=$('<input class="menutree-searchbox" />').appendTo(sw);
            state.searchbox=s;
        }
        s.searchbox({
            searcher:function (q){
                var t=panel.find('.menutree-tree');
                if (t.length>0) {
                    var data=t.tree('getRoots');
                    formatData(data,q,null,opts.searchFields);
                    var keepRoot=!opts.rootCollapsible;  //如果root菜单可折叠 则不keeproot
                    formatNode(data,q,true,keepRoot );
                    state._q=q;
                }

            },
            prompt:opts.prompt
        })

        if(opts.searchable){
            sw.removeClass('menutree-hidden');
        }else{
            sw.addClass('menutree-hidden');
        }
    }

    function addTreeLiCls(jq,level){
        level=level||1;
        if(jq && jq.length>0 ) {
            jq.find('>li').each(function(){
                var clsName='menutree-li-level'+(level>2?'x':level)
                if (!$(this).hasClass(clsName)) {
                    $(this).removeClass( 'menutree-li-level1 menutree-li-level2 menutree-li-levelx' ).addClass(clsName)
                }

                var nextLevl=$(this).find('>ul');
                if(nextLevl.length>0) {
                    addTreeLiCls(nextLevl,level+1); //下级
                }else{
                    if(level>1) {
                        $(this).find('>.tree-node>.tree-indent').last().addClass('tree-indent-hit');  //最后一个缩进要和折叠按钮同宽度
                    }
                }
                
            })
        }

        if(level==1 && jq.find('li.menutree-li-levelx').length==0) {
            jq.addClass('menutree-tree-nox');
        }

        
    }

    function setTree(ele){
        var state=$.data(ele, "menutree")
        var opts = state.options;
        var panel = state.panel;
        var tw=panel.find('.menutree-tree-wrap');
        var t=tw.find('.menutree-tree');
        
        if(t.length==0) {
            t=$('<div class="menutree-tree" ></div>').appendTo(tw);
            state.tree=t;
        }
        var treeOpts=$.extend({},opts,{
            formatter:treeNodeFormatter,
            onClick: function (node) {
                if (!t.tree('isLeaf',node.target)) {   //菜单组允许点击进行展开折叠
                    var roots=t.tree('getRoots');
                    var isRoot=$.hisui.indexOfArray(roots,'id',node.id)>-1; //是否是根节点
                    if (opts.rootCollapsible||!isRoot) {  //根节点允许折叠 或者不是根节点
                        
                        if(opts.onlyOneExpanded && node.state=='closed') {  //只允许一个打开  需要将同级已打开的关掉
                            var p=t.tree('getParent',node.target),bros=null;
                            if(p) {
                                bros=t.tree('getChildren',p.target);
                            }else{
                                bros=roots;
                            }

                            $.each(bros,function(i,o){
                                if(o.id!=node.id && o.state=='open') t.tree('collapse',o.target);
                            })
                        }
                        t.tree('toggle',node.target);

                    }
                    opts.onMenuGroupClick.call(ele,node);
                }else{
                    opts.onMenuClick.call(ele,node);

                }
                opts.onClick.call(this,node)
            },onBeforeExpand:function(node){  //菜单展开前 关闭其它 
                var roots=t.tree('getRoots');
                if(opts.onlyOneExpanded) {  //只允许一个打开  需要将同级已打开的关掉
                    var p=t.tree('getParent',node.target),bros=null;
                    if(p) {
                        bros=t.tree('getChildren',p.target);
                    }else{
                        bros=roots;
                    }

                    $.each(bros,function(i,o){
                        if(o.id!=node.id && o.state=='open') t.tree('collapse',o.target);
                    })
                }

            },onLoadSuccess:function(node,data){
                opts.onLoadSuccess.call(ele,node,data);
                addTreeLiCls(t)  //为树各级节点的li元素增加样式类
                //setTreeDataState(data,!node,opts.onlyOneExpanded,opts.rootCollapsible);
            },loadFilter:function(data,par){
                var tdata=opts.loadFilter.call(ele,data,par);
                setTreeDataState(tdata,!par,opts.onlyOneExpanded,opts.rootCollapsible);
                return tdata;
            },
        })
        t.tree(treeOpts);


        if(opts.title) {
            var tt=tw.find('.menutree-tree-title');
            if(tt.length==0) {
                tt=$('<div class="menutree-tree-title"></div>').prependTo(tw);
            }
            tt.html( $.hisui.getTrans(opts.title) );
            tw.addClass('menutree-tree-withtitle');
        }else{
            tw.find('.menutree-tree-title').remove();
            tw.removeClass('menutree-tree-withtitle');
        }

        if (!opts.rootCollapsible) {  //如果禁止根节点折叠
            tw.addClass('menutree-tree-norootcollapse');
        }else{
            tw.removeClass('menutree-tree-norootcollapse');
        }

        if(opts.collapsible) {  //允许向左折叠
            tw.addClass('menutree-tree-collapsible');

            setSubTree(ele);
        }else{
            tw.removeClass('menutree-tree-collapsible');
        }

        t.off('.menutree').on('mouseenter.menutree', '>li', function () {
            var $that=$(this);
            if ($that.closest('.menutree').hasClass('menutree-min') && !state._isClickShowSub ) {
                if(state._hideSubTimer) clearTimeout(state._hideTimer);
                state._showSubTimer=setTimeout(function(){
                    showSubTree($that);
                },200)
            }
        }).on('mouseleave.menutree','>li',function(){
            var $that=$(this);
            if ($that.closest('.menutree').hasClass('menutree-min') && !state._isClickShowSub) {
                if(state._showSubTimer) clearTimeout(state._showSubTimer);
                state._hideSubTimer=setTimeout(function(){
                    var sp = state.subpanel;
                    sp.panel('close');
                    state._isClickShowSub=false;
                })
            }
        }).on('click.menutree','>li',function(){
            var $that=$(this);
            if ($that.closest('.menutree').hasClass('menutree-min') ) {
                if(state._hideSubTimer) clearTimeout(state._hideTimer);
                if(state._showSubTimer) clearTimeout(state._showSubTimer);
                showSubTree($that);
                state._isClickShowSub=true;
            }

        })

        function showSubTree($li){
            var sp = state.subpanel;
            var liOffset = $li.offset();
            var x = liOffset.left + $li._outerWidth(),
                y = liOffset.top-1;
            sp.panel("move", { left: x, top: y });
            sp.panel("open");
            var subtree = sp.find('.menutree-tree');

            var target = $li.find('>.tree-node');
            var node = t.tree('getNode', target);
            var cloneNodeData = getCloneNodeData(node);
            if(cloneNodeData.children && cloneNodeData.state!='open') {
                cloneNodeData.state='open';
            }
            var subData = [cloneNodeData];

            ///加载主树节点某一节点所有数据
            subtree.tree('loadData', subData);

            ///同步主树的选中状态
            var maintree=state.tree;
            var selected=maintree.tree('getSelected');
            if(selected ) {
                var mynode=subtree.tree('find',selected.id);
                if(mynode) subtree.tree('select',mynode.target);
            }
            ///同步主树的查询状态
            var q=state._q;
            if(q){
                var data=subtree.tree('getRoots');
                formatData(data,q,null,opts.searchFields);
                var keepRoot=!opts.rootCollapsible;  //如果root菜单可折叠 则不keeproot
                formatNode(data,q,true,keepRoot );
            }




            sp.panel("resize", { width: opts.width, height: 'auto' });

            $li.addClass('menutree-root-hover');
        }

    }

    function setTreeDataState(data,isRoot,onlyOneExpanded,rootCollapsible){
        var flag=false;
        for (var i=0;i<data.length;i++) {
            var item=data[i];
            if(item.children) {
                if(isRoot) {
                    if(rootCollapsible) { //根节点可折叠情况下 
                        if(item.state!='closed'){
                            if(flag) {
                                if(onlyOneExpanded) item.state='closed';  //只能一个展开
                            }else{
                                flag=true;
                            }
                        }
                    }else{  //不可折叠情况下 根节点要全展开
                        item.state='open';
                    }
                    if(!item.iconCls) item.iconCls='icon-book-rep';  //为根节点增加图标
                }else{  //
                    if(item.state!='closed'){
                        if(flag) {
                            if(onlyOneExpanded) item.state='closed';  //只能一个展开
                        }else{
                            flag=true;
                        }
                    }
                }
                
                setTreeDataState(item.children,false,onlyOneExpanded,rootCollapsible);
            }

        }
        return data;
    }
    

    function getCloneNodeData(node){
        var ret={};
        for (var i in node) {
            if(i=='domId' || i=='target' ) {
                continue;
            } else if (i=='children') {
                ret.children=[];
                for (var j=0;j<node.children.length;j++) {
                    var newItem=getCloneNodeData(node.children[j]);
                    ret.children.push(newItem);
                }
            }else if (typeof node[i]=='object' ){
                ret[i]=$.extend({},node[i],true);
            }else if (typeof node[i]=='string' || typeof node[i]=='number'){
                ret[i]=node[i];
            }
        }
        return ret;
    }


    function setSubTree(ele){
        var state=$.data(ele, "menutree")
        var opts = state.options;
        var subpanel = state.subpanel;
        var tw=subpanel.find('.menutree-tree-wrap');
        var t=tw.find('.menutree-tree');
        
        if(t.length==0) {
            t=$('<div class="menutree-tree menutree-subtree" ></div>').appendTo(tw);
            state.subtree=t;
        }
        var treeOpts=$.extend({},opts,{
            formatter:treeNodeFormatter,
            onClick: function (node) {
                if (!t.tree('isLeaf',node.target)) {   //菜单组允许点击进行展开折叠
                    var roots=t.tree('getRoots');
                    var isRoot=$.hisui.indexOfArray(roots,'id',node.id)>-1; //是否是根节点
                    if (!isRoot) {  //subtree 根节点不能折叠
                        
                        if(opts.onlyOneExpanded && node.state=='closed') {  //只允许一个打开  需要将同级已打开的关掉
                            var p=t.tree('getParent',node.target),bros=null;
                            if(p) {
                                bros=t.tree('getChildren',p.target);
                            }else{
                                bros=roots;
                            }

                            $.each(bros,function(i,o){
                                if(o.id!=node.id && o.state=='open') t.tree('collapse',o.target);
                            })
                        }
                        t.tree('toggle',node.target);

                    }
                    opts.onMenuGroupClick.call(ele,node);
                }else{
                    subpanel.panel('close');
                    opts.onMenuClick.call(ele,node);

                }
                opts.onClick.call(ele,node)
            },onBeforeExpand:function(node){  //菜单展开前 先关其它
                var roots=t.tree('getRoots');
                var isRoot=$.hisui.indexOfArray(roots,'id',node.id)>-1; //是否是根节点
                if (!isRoot) {  //subtree 根节点不能折叠
                    
                    if(opts.onlyOneExpanded) {  //只允许一个打开  需要将同级已打开的关掉
                        var p=t.tree('getParent',node.target),bros=null;
                        if(p) {
                            bros=t.tree('getChildren',p.target);
                        }else{
                            bros=roots;
                        }

                        $.each(bros,function(i,o){
                            if(o.id!=node.id && o.state=='open') t.tree('collapse',o.target);
                        })
                    }
                }

            },onExpand:function(node){  //subtree操作 同步至原树操作
                var maintree=state.tree;
                var t=maintree.tree('find',node.id);
                maintree.tree('expand',t.target);
            },onCollapse:function(node){
                var maintree=state.tree;
                var t=maintree.tree('find',node.id);
                maintree.tree('collapse',t.target);
            },onSelect:function(node){
                var maintree=state.tree;
                var t=maintree.tree('find',node.id);
                maintree.tree('select',t.target);
            },loadFilter:function(data,par){
                var tdata=opts.loadFilter.call(ele,data,par);
                setTreeDataState(tdata,!par,opts.onlyOneExpanded,opts.rootCollapsible);
                return tdata;
            },onLoadSuccess:function(node,data){
                addTreeLiCls(t)
            }
        })
        t.tree(treeOpts);


        t.off('.menutree').on('mouseenter.menutree', function () {
            if(state._hideSubTimer) {
                clearTimeout(state._hideSubTimer);
            }
        }).on('mouseleave.menutree',function(){
            if(!state._isClickShowSub) {
                state._hideSubTimer=setTimeout(function(){
                    subpanel.panel('close');
                },200);
            }
        })
    }


    function treeNodeFormatter(node,search){
        var text=node.text;
        if (search&&search!='') {
            var reg=new RegExp(search, 'ig');
            text=text.replace(reg,"<span class='menutree-reg-word'>"+search+"</span>");
        }

        if(node && node.attributes &&(node.attributes.count && node.attributes.count!='' && node.attributes.count!=0)) {
            return text+' '+'<span class="menutree-tip-count">'+node.attributes.count+'</span>'
        }else{
            return text;
        }
    }

    function isContains(str,q){
        var flag=false;
        if (str.indexOf(q)>-1) {
            flag=true;
        }else{
            var spellArr=$.hisui.getChineseSpellArray(str);
            var len=spellArr.length;

            var spellMatch=false;
            for (var j=0;j<len;j++){
                var spellL=(spellArr[j]||'').toLowerCase();
                var spellIndex=spellL.indexOf(q);
                if(spellIndex>-1) {
                    flag=true;
                    break;
                }

            }

        }
        return flag;
    }

    function formatData(data,search,parent,searchFields){
        var flag=false,
            pok=(parent && parent._ok),
            search=search.toLowerCase();
        for(var i=0;i<data.length;i++){
            var item=data[i];
            item._ok=false;
            if(pok){
                item._ok=true;
            }else{
                var text=item.text.toLowerCase();
                if (isContains(text,search)) {
                    item._ok=true;
                }else if(searchFields){
                    var searchFieldArr=searchFields.split(',');
                    for(var fInd=0;fInd<searchFieldArr.length;fInd++) {
                        var filed=searchFieldArr[fInd];
                        var fieldValue=item[filed];
                        if(!fieldValue && item.attributes) fieldValue=item.attributes[filed];
                        if (fieldValue && isContains(fieldValue,search)) {
                            item._ok=true;
                            break;
                        }
                    }
                }
                
            }
            if (item.children ){
                formatData(item.children,search,item,searchFields);
            }
            if (item._ok) flag=true;
        }
        if (flag && parent) parent._ok=true;
    }
    function formatNode(data,search,isRoot,keepRoot){
        for(var i=0;i<data.length;i++){
            var item=data[i];
            
            if (item.children ){
                formatNode(item.children,search,false,keepRoot);
            }
            var t=$("#"+item.domId);
            
            if (isRoot && keepRoot){
                //保持根节点并且是根节点 不用处理
            }else if (item._ok) {
                var html=treeNodeFormatter(item,search);
                t.find('.tree-title').html(html);
                t.removeClass('menutree-node-hidden');  
            } else{
                t.addClass('menutree-node-hidden');
            }
        }
    }
    function selectById(ele,id){
        var state=$.data(ele, "menutree")
        var node=state.tree.tree('find',id);
        if(node) state.tree.tree('select',node.target);

    }
    $.fn.menutree = function (opt, arg) {
        if (typeof opt == "string") {
            var mth = $.fn.menutree.methods[opt];
            return mth(this, arg);
            
        }
        opt = opt || {};
        return this.each(function () {
            var state = $.data(this, "menutree");
            if (state) {
                $.extend(state.options, opt);
            } else {
                var o=create(this);

                $.data(this, "menutree", {
                    panel:o.panel,
                    subpanel:o.subpanel,
                    options: $.extend({}, $.fn.menutree.defaults, $.fn.menutree.parseOptions(this), opt)
                });
                state = $.data(this, "menutree");
            }
            if (state.options.collapsible && !state.options.title) {  //如果是可折叠的
                state.options.title='导航菜单';
            }

            setCollapse(this);
            setSearchbox(this);
            setTree(this);
            resize(this);
        });
    };

    $.fn.menutree.methods = {
        options: function (jq) {
            return $.data(jq[0], "menutree").options;
        },
        getTree:function(jq){
            return $.data(jq[0], "menutree").tree;
        },selectById:function(jq,param){
            jq.each(function(){
                selectById(this,param)
            })
        }

    };
    $.fn.menutree.parseOptions = function (ele) {
        var proxy=$('<div class="menutree-default-width"></div>').appendTo('body');
        var width=proxy.width();
        proxy.remove();
        proxy=$('<div class="menutree-default-min-width"></div>').appendTo('body');
        var minwidth=proxy.width();
        proxy.remove();


        var t = $(ele);
        return $.extend({width:width,minwidth:minwidth},$.fn.combo.parseOptions(ele), $.parser.parseOptions(ele, ["width","height","prompt",{fit:'boolean'}]));
    };
    $.fn.menutree.defaults = $.extend({}, $.fn.tree.defaults,{
        title: '',  //标题
        collapsible: false, //是否可折叠
        rootCollapsible: true, //根节点是否可折叠 
        width:'auto',
        height:'auto',
        fit:false,
        searchable:true,
        animate:true,
        onlyOneExpanded:true  //同级只允许展开一个菜单组
        ,searchFields:''  //除text字段外 用于查询过滤的字段
        ,onMenuClick:function(node){ //菜单点击事件

        },onMenuGroupClick:function(node){ //菜单组点击事件
            
        },onPanelCollapse:function(width){ //向左折叠事件 width折叠后宽度

        },onPanelExpand:function(width){ //向右展开事件 width展开后宽度

        }
    });
})(jQuery);