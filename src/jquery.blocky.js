/* Linear partition
 Partitions a sequence of non-negative integers into k ranges
 Based on Óscar López implementation in Python (http://stackoverflow.com/a/7942946)
 Also see http://www8.cs.umu.se/kurser/TDBAfl/VT06/algorithms/BOOK/BOOK2/NODE45.HTM
 Dependencies: UnderscoreJS (http://www.underscorejs.org)
 Example: linear_partition([9,2,6,3,8,5,8,1,7,3,4], 3) => [[9,2,6,3],[8,5,8],[1,7,3,4]]*/
;(function(){this.linear_partition=function(){return function(r,n){var t,u,o,f,i,c,a,e,h,s,p,v,l;if(i=r.length,0>=n)return[];if(n>i)return r.map(function(r){return[r]});for(a=function(){var r,t;for(t=[],h=r=0;i>=0?i>r:r>i;h=i>=0?++r:--r)t.push(function(){var r,t;for(t=[],e=r=0;n>=0?n>r:r>n;e=n>=0?++r:--r)t.push(0);return t}());return t}(),c=function(){var r,t,u;for(u=[],h=r=0,t=i-1;t>=0?t>r:r>t;h=t>=0?++r:--r)u.push(function(){var r,t,u;for(u=[],e=r=0,t=n-1;t>=0?t>r:r>t;e=t>=0?++r:--r)u.push(0);return u}());return u}(),u=s=0;i>=0?i>s:s>i;u=i>=0?++s:--s)a[u][0]=r[u]+(u?a[u-1][0]:0);for(o=p=0;n>=0?n>p:p>n;o=n>=0?++p:--p)a[0][o]=r[0];for(u=v=1;i>=1?i>v:v>i;u=i>=1?++v:--v)for(o=l=1;n>=1?n>l:l>n;o=n>=1?++l:--l)f=_.min(function(){var r,n;for(n=[],e=r=0;u>=0?u>r:r>u;e=u>=0?++r:--r)n.push([_.max([a[e][o-1],a[u][0]-a[e][0]]),e]);return n}(),function(r){return r[0]}),a[u][o]=f[0],c[u-1][o-1]=f[1];for(i-=1,n-=2,t=[];n>=0;)t=[function(){var t,o,f,a;for(a=[],u=t=o=c[i-1][n]+1,f=i+1;f>=o?f>t:t>f;u=f>=o?++t:--t)a.push(r[u]);return a}()].concat(t),i=c[i-1][n],n-=1;return[function(){var n,t,o;for(o=[],u=n=0,t=i+1;t>=0?t>n:n>t;u=t>=0?++n:--n)o.push(r[u]);return o}()].concat(t)}}(this)}).call(this);

(function ( $ ) {
    "use strict";

    var name = 'js_blocky';

    /**
     * Plugin registration
     * @param opts
     * @returns {*}
     */
    $.fn.blocky = function (opts) {
        return this.each(function () {
            new Blocky(this, opts);
        });
    }

    /**
     * Plugin body
     *
     * @param el
     * @param opts
     * @constructor
     */
    function Blocky(el, opts) {
        this.$el        = $(el);
        this.$el.data(name, this);

        this.defaults   = {
            idealHeight: 250,
            spacing: 0,
            imageRoot: null,
            data: null
        };
        this.opts       = $.extend(this.defaults, opts);

        this.output = {};
        this.blocks = [];

        this.init();
        this.display();
    };

    /**
     * Takes our data object and displays the contents
     */
    Blocky.prototype.display = function () {
        for( var i in this.output ) {
            var $el = this.markup();

            $el.css({
                width: this.output[i].width,
                height: this.output[i].height
            });

            if( this.opts.imageRoot ) {
                $el.css('background-image', 'url('+this.opts.imageRoot+'/'+i+'/thumb)');
            }

            $el.data('realname', this.output[i].realname);
            $el.data('filesize', this.output[i].filesize);

            this.blocks.push( $el );
            this.$el.append( $el );
        };
    };

    /**
     * Initialise
     */
    Blocky.prototype.init = function () {

        // initial algorithm data
        var viewport_width = this.$el.width();
        var total_width = this.getTotalWidth();
        var rows = this.getRowCount( total_width, viewport_width );

        if( rows < 1 ) { this.single(); }
        else {
            // start the algorithm
            this.partitions = this.run(rows);
            var index = 0;

            // each partition row
            for( var i in this.partitions ) {
                var buffer = [];

                // for each block in the partition
                for( var j in this.partitions[i] ) {
                    buffer.push( this.opts.data[index++] );
                };

                // total aspect ratio per row
                var total_ratios = buffer.reduce(function (sum, block) {
                    return sum += block.aspect;
                }, 0);

                // calculate new dimensions for each block in this row
                for( var j in buffer ) {
                    this.output[buffer[j].name] = {
                        width: parseInt( (viewport_width / total_ratios * buffer[j].aspect) - this.opts.spacing ),
                        height: parseInt( viewport_width / total_ratios ),
                        realname: buffer[j].realname,
                        filesize: buffer[j].filesize
                    };
                };
            };
        }
    };

    /**
     * Creates weightings and runs linear partition
     *
     * @param rows
     * @returns {*}
     */
    Blocky.prototype.run = function (rows) {

        // weight each block
        var weights = this.opts.data.map(function (block) {
            return parseInt( block.aspect * 100 );
        });

        return this.linearPartition(weights, rows);
    };

    /**
     * Setup data for when we have less than a single row of images
     */
    Blocky.prototype.single = function () {

        for( var i in this.opts.data ) {
            var block = this.opts.data[i];
            this.output[block.name] = {
                width: parseInt( this.opts.idealHeight * block.aspect ),
                height: this.opts.idealHeight,
                realname: block.realname,
                filesize: block.filesize
            };
        }
    };

    /**
     * Total width of all images after scaling
     */
    Blocky.prototype.getTotalWidth = function () {
        var plugin = this;
        return this.opts.data.reduce(function (sum, block) {
            return sum += ( block.aspect * plugin.opts.idealHeight );
        }, 0);
    };

    /**
     * Gets the number of rows that we'll be creating
     *
     * @param total_width
     * @param viewport
     * @returns {number}
     */
    Blocky.prototype.getRowCount = function (total_width, viewport) {
        return Math.round( total_width / viewport );
    };

    /**
     * Executes linear partition algorithm
     * note: Uses linear partition library included at the top of this script
     *
     * @param weight
     * @param rows
     */
    Blocky.prototype.linearPartition = function (weights, rows) {
        return linear_partition(weights, rows);
    };

    /**
     * Markup for a single image
     */
    Blocky.prototype.markup = function () {
        return $('<div class="blocky-photo"></div>');
    };


    Blocky.prototype.getBlocks = function () {
        return this.blocks;
    };

    /**
     * Reset Blocky
     */
    Blocky.prototype.reset = function () {
        this.$el.removeData(name);
        this.$el.empty();
        this.$el = null;
        this.output = [];
        this.blocks = [];
        this.opts = null;
    };
}(jQuery));