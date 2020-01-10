const SUPPORTED_TYPES = ['appointment', 'all-day', 'meeting'];
const SUBJECT_INDEX = 1;
const DURATION_INDEX = 4;
const TYPE_INDEX = 6;

class CalendarEntry {
    constructor(e) {
        this.subject = e.entrydata[SUBJECT_INDEX].text[0];
        if (e.entrydata[DURATION_INDEX].number) {
            this.duration = parseInt(e.entrydata[DURATION_INDEX].number[0]);
        } else {
            this.duration = parseInt(e.entrydata[DURATION_INDEX].numberlist.number[[0]]);
        }

        this.durationHours = this.duration / (60*60);

        this.type = this._mapType(e.entrydata[TYPE_INDEX].text[0]);
    }

    _mapType(value) {
        switch (parseInt(value)) {
            default:
                return null;
            case 0:
                return 'appointment';
            case 1:
                return 'anniversary';
            case 2:
                return 'all-day';
            case 3:
                return 'meeting';
            case 4:
                return 'reminder';

        }
    }
}