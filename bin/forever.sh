#!/bin/bash


f_start() {
    forever start -l /var/www/log/sudoku/log -o /var/www/log/sudoku/stdout -e /var/www/log/sudoku/stderr -a --uid "sudoku" --spinSleepTime 600000 /var/www/sudoku/bin/www
}

f_stop () {
    forever stop sudoku
}

f_restart () {
    forever restart sudoku
}

f_deploy() {
    git pull origin master
    npm install
    f_restart
}

case "$1" in
	start )
		f_start
		;;
	restart )
		f_restart
		;;
	deploy )
	    f_deploy
	    ;;
	* )
		;;
esac

exit 0
