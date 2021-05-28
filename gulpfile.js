let projectFolder = 'dist';
let sourceFolder = 'src';

let fs = require('fs');

let path = {
    build: {
        html: projectFolder + '/',
        css: projectFolder + '/css/',
        js: projectFolder + '/js/',
        img: projectFolder + '/img/'
    },
    src: {
        html: [sourceFolder + '/*.html', '!' + sourceFolder + '/_*.html'],
        readyCss: [sourceFolder + '/scss/null.scss'],
        css: [sourceFolder + '/scss/styles.scss'],
        js: sourceFolder + '/js/*.js',
        img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}'
    },
    watch: {
        html: sourceFolder + '/**/*.html',
        css: sourceFolder + '/scss/**/*.scss',
        js: sourceFolder + '/js/**/*.js',
        img: sourceFolder + '/img/**/*.{ipg,png,svg,gif,ico,webp}',
    },
    clean: './' + projectFolder + '/'
}

let { src, dest } = require('gulp');
let gulp = require('gulp');
let browserSync = require('browser-sync').create();
let del = require('del');
let scss = require('gulp-sass');
let autoprefixer = require('gulp-autoprefixer');
let groupMedia = require('gulp-group-css-media-queries');
let cleanCss = require('gulp-clean-css');
let rename = require('gulp-rename');
let uglify = require('gulp-uglify-es').default;

function browserSyncFunction() {
    browserSync.init({
        server: {
            baseDir: './' + projectFolder + '/'
        },
        port: 3000,
        notify: false,
        online: true
    });
}

function html() {
    return src(path.src.html)
        .pipe(dest(path.build.html))
        .pipe(browserSync.stream());
}

function css() {
    src(path.src.readyCss)
        .pipe(scss({
            outputStyle: 'expanded'
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream());
    return src(path.src.css)
        .pipe(scss({
            outputStyle: 'expanded'
        }))
        .pipe(groupMedia())
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 5 versions'],
            cascade: true
        }))
        .pipe(dest(path.build.css))
        .pipe(browserSync.stream());
}

function js() {
    return src(path.src.js)
        .pipe(dest(path.build.js))
        .pipe(browserSync.stream());
}

function images() {
    return src(path.src.img)
        .pipe(dest(path.build.img))
        .pipe(browserSync.stream());
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean() {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(js, css, html, images));
let watch = gulp.parallel(build, watchFiles, browserSyncFunction);

exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;