var fs = require("fs");
var path = require("path");
var argparse =  require( "argparse" );
var beautify = require('js-beautify').js_beautify;
var uglify = require("uglify-js");
var spawn = require('child_process').spawn;
const exec = require('child_process').exec;

function main() {

	"use strict";

	var copyRecursiveSync = function(src, dest) {
	  var exists = fs.existsSync(src);
	  var stats = exists && fs.statSync(src);
	  var isDirectory = exists && stats.isDirectory();
	  if (exists && isDirectory) {
	    fs.mkdirSync(dest);
	    fs.readdirSync(src).forEach(function(childItemName) {
	      copyRecursiveSync(path.join(src, childItemName),
	                        path.join(dest, childItemName));
	    });
	  } else {
	    fs.linkSync(src, dest);
	  }
	};

	var deleteFolderRecursive = function(path) {
	  if( fs.existsSync(path) ) {
	    fs.readdirSync(path).forEach(function(file,index){
	      var curPath = path + "/" + file;
	      if(fs.lstatSync(curPath).isDirectory()) { // recurse
	        deleteFolderRecursive(curPath);
	      } else { // delete file
	        fs.unlinkSync(curPath);
	      }
	    });
	    fs.rmdirSync(path);
	  }
	};

	var parser = new argparse.ArgumentParser();
	parser.addArgument( ['--build'], { action: 'storeTrue', required: false } );
	parser.addArgument( ['--include'], { action: 'append', required: false } );
	parser.addArgument( ['--externs'], { action: 'append', defaultValue: ['./externs/common.js'] } );
	parser.addArgument( ['--amd'], { action: 'storeTrue', defaultValue: false } );
	parser.addArgument( ['--minify'], { action: 'storeTrue', defaultValue: false } );
	parser.addArgument( ['--beautify'], { action: 'storeTrue', defaultValue: false } );
	parser.addArgument( ['--output'], { defaultValue: '../../build/bravey.js' } );
	parser.addArgument( ['--sourcemaps'], { action: 'storeTrue', defaultValue: false } );
	parser.addArgument( ['--docs'], { action: 'storeTrue', defaultValue: false } );

	
	var args = parser.parseArgs();

	if (args.build) {
		
		var output = args.output;
		console.log(' * Building ' + output);
		
		var sourcemap = '';
		var sourcemapping = '';

		if ( args.sourcemaps ){

			sourcemap = output + '.map';
			sourcemapping = '\n//# sourceMappingURL=bravey.min.js.map';

		}

		var buffer = [];
		var sources = []; // used for source maps with minification

		if ( args.amd ){
			buffer.push('function ( root, factory ) {\n\n\tif ( typeof define === \'function\' && define.amd ) {\n\n\t\tdefine( [ \'exports\' ], factory );\n\n\t} else if ( typeof exports === \'object\' ) {\n\n\t\tfactory( exports );\n\n\t} else {\n\n\t\tfactory( root );\n\n\t}\n\n}( this, function ( exports ) {\n\n');
		};
		
		for ( var i = 0; i < args.include.length; i ++ ){
			
			var contents = fs.readFileSync( './includes/' + args.include[i] + '.json', 'utf8' );
			var files = JSON.parse( contents );

			for ( var j = 0; j < files.length; j ++ ){

				var file = '../../' + files[ j ];
				
				buffer.push('// File:' + files[ j ]);
				buffer.push('\n\n');

				contents = fs.readFileSync( file, 'utf8' );

				sources.push( { file: file, contents: contents } );
				buffer.push( contents );
				buffer.push( '\n' );
			}

		}
		
		if ( args.amd ){
			buffer.push('exports.Bravey = Bravey;\n\n} ) );');
		};
		
		var temp = buffer.join( '' );
		
		if ( !args.minify ){

			fs.writeFileSync( output, temp, 'utf8' );

		} else {

			var LICENSE = "Bravey v0.1 - http://github.com/braveyjs/bravey - MIT Licensed";

			// Parsing

			var toplevel = null;

			toplevel = uglify.parse( '// ' + LICENSE + '\n' );

			sources.forEach( function( source ) {

				toplevel = uglify.parse( source.contents, {
					filename: source.file,
					toplevel: toplevel
				} );

			} );

			// Compression

			toplevel.figure_out_scope();
			var compressor = uglify.Compressor( {} );
			var compressed_ast = toplevel.transform( compressor );

			// Mangling

			compressed_ast.figure_out_scope();
			compressed_ast.compute_char_frequency();
			compressed_ast.mangle_names();

			// Output

			var source_map_options = {
				file: 'bravey.min.js',
				root: 'src'
			};

			var source_map = uglify.SourceMap( source_map_options )
			var stream = uglify.OutputStream( {
				source_map: source_map,
				comments: new RegExp( LICENSE )
			} );

			compressed_ast.print( stream );
			var code = stream.toString();

			fs.writeFileSync( output, code + sourcemapping, 'utf8' );

			if ( args.sourcemaps ) {

				fs.writeFileSync( sourcemap, source_map.toString(), 'utf8' );

			}

		}

	}

	if ( args.docs ){
		console.log(' * Building docs');
		exec('node ../../node_modules/jsdoc/jsdoc.js -c jsdoc-conf.json --readme ../../README.md' ,function(err,stdout,stderr){
		      console.log("   * Result: ",err,stdout,stderr);
		 })
		deleteFolderRecursive("../../doc/doc-static");
		copyRecursiveSync("../../doc-static","../../doc/doc-static");
	}

	if ( args.beautify ){
		console.log(' * Beautifying sources');
		
		for ( var i = 0; i < args.include.length; i ++ ) {
			
			var contents = fs.readFileSync( './includes/' + args.include[i] + '.json', 'utf8' );
			var files = JSON.parse( contents );

			for ( var j = 0; j < files.length; j ++ ){

				var file = '../../' + files[ j ];
				var result = beautify(fs.readFileSync( file, 'utf8' ), { indent_size: 2 });
				fs.writeFileSync( file, result, 'utf8' );
			}

		}

	}


}

main();