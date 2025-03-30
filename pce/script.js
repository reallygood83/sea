// 전역 변수
let timerInterval;
let remainingTime = 0;
let isTimerRunning = false;
let students = [];
let groups = [];

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', function() {
    // 섹션 토글 기능
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const btn = this.querySelector('.toggle-btn');
            content.classList.toggle('hidden');
            btn.textContent = content.classList.contains('hidden') ? '▼' : '▲';
        });
    });

    // 드래그 앤 드롭 기능
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.id);
        });

        section.addEventListener('dragover', function(e) {
            e.preventDefault();
        });

        section.addEventListener('drop', function(e) {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            const draggedSection = document.getElementById(id);
            const container = document.getElementById('sectionsContainer');
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement) {
                container.insertBefore(draggedSection, afterElement);
            } else {
                container.appendChild(draggedSection);
            }
        });
    });

    // 시계 시작
    updateClock();
    setInterval(updateClock, 1000);

    // 날짜/시간표 업데이트
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // 학생 목록 초기화
    initializeStudents();
});

// 시계 업데이트
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// 날짜/시간표 업데이트
function updateDateTime() {
    const now = new Date();
    const dateString = now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    document.querySelector('.date-timetable').textContent = dateString;
}

// 타이머 관련 함수들
function startTimer() {
    if (!isTimerRunning) {
        const hours = parseInt(document.getElementById('hours').value) || 0;
        const minutes = parseInt(document.getElementById('minutes').value) || 0;
        const seconds = parseInt(document.getElementById('seconds').value) || 0;
        
        remainingTime = hours * 3600 + minutes * 60 + seconds;
        if (remainingTime > 0) {
            isTimerRunning = true;
            updateTimerDisplay();
            timerInterval = setInterval(updateTimerDisplay, 1000);
        }
    }
}

function stopTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    stopTimer();
    remainingTime = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    if (remainingTime <= 0) {
        stopTimer();
        document.getElementById('timerDisplay').textContent = '00:00:00';
        return;
    }

    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;

    document.getElementById('timerDisplay').textContent = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    remainingTime--;
}

// 학생 뽑기 관련 함수들
function pickStudents() {
    const studentList = document.getElementById('studentList').value.split(',').map(s => s.trim());
    const pickCount = parseInt(document.getElementById('pickCount').value);
    
    if (studentList.length === 0) {
        alert('학생 목록을 입력해주세요.');
        return;
    }

    if (pickCount > studentList.length) {
        alert('뽑을 인원이 학생 수보다 많습니다.');
        return;
    }

    const shuffled = [...studentList].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, pickCount);
    
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = `<strong>뽑힌 학생:</strong><br>${picked.join(', ')}`;
}

function clearResult() {
    document.getElementById('resultArea').innerHTML = '';
    document.getElementById('studentList').value = '';
    document.getElementById('pickCount').value = '1';
}

// 출석부 관련 함수들
function initializeStudents() {
    // NEIS API를 통한 학생 정보 가져오기
    const apiKey = 'YOUR_NEIS_API_KEY';
    const schoolCode = 'YOUR_SCHOOL_CODE';
    const classCode = 'YOUR_CLASS_CODE';
    
    // API 호출 예시 (실제 구현 시에는 적절한 에러 처리 필요)
    fetch(`https://open.neis.go.kr/hub/classInfo?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${schoolCode}&CLASS_CODE=${classCode}`)
        .then(response => response.json())
        .then(data => {
            students = data.classInfo[1].row.map(student => ({
                id: student.STDNT_NO,
                name: student.STDNT_NM,
                status: 'present'
            }));
            updateAttendanceList();
        })
        .catch(error => {
            console.error('학생 정보를 가져오는데 실패했습니다:', error);
            // 임시 데이터로 초기화
            students = [
                { id: '1', name: '홍길동', status: 'present' },
                { id: '2', name: '김철수', status: 'present' },
                { id: '3', name: '이영희', status: 'present' }
            ];
            updateAttendanceList();
        });
}

function updateAttendanceList() {
    const tbody = document.getElementById('attendanceList');
    tbody.innerHTML = '';
    
    students.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.name}</td>
            <td>
                <select onchange="updateStudentStatus(${student.id}, this.value)">
                    <option value="present" ${student.status === 'present' ? 'selected' : ''}>출석</option>
                    <option value="absent" ${student.status === 'absent' ? 'selected' : ''}>결석</option>
                    <option value="late" ${student.status === 'late' ? 'selected' : ''}>지각</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStudentStatus(studentId, status) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        student.status = status;
        updateAttendanceList();
    }
}

// 조 편성 관련 함수들
function createGroups() {
    const groupCount = parseInt(document.getElementById('groupCount').value);
    if (groupCount <= 0) {
        alert('올바른 조 수를 입력해주세요.');
        return;
    }

    const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
    groups = [];
    
    for (let i = 0; i < groupCount; i++) {
        const start = Math.floor(i * shuffledStudents.length / groupCount);
        const end = Math.floor((i + 1) * shuffledStudents.length / groupCount);
        groups.push(shuffledStudents.slice(start, end));
    }

    displayGroups();
}

function displayGroups() {
    const groupsList = document.getElementById('groupsList');
    groupsList.innerHTML = '';
    
    groups.forEach((group, index) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.innerHTML = `
            <h4>${index + 1}조</h4>
            <ul>
                ${group.map(student => `<li>${student.name}</li>`).join('')}
            </ul>
        `;
        groupsList.appendChild(groupDiv);
    });
}

// 탭 전환 함수
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`${tabName}Tab`).classList.add('active');
    event.target.classList.add('active');
}

// 드래그 앤 드롭 헬퍼 함수
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.section:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// 칠판 관련 함수들
function formatText(command) {
    document.execCommand(command, false, null);
}

function changeFontSize(size) {
    document.execCommand('fontSize', false, size);
}

function clearChalkboard() {
    if (confirm('칠판을 지우시겠습니까?')) {
        document.getElementById('chalkboardEditor').innerHTML = '';
    }
}

// 유튜브 관련 함수들
function changeVideo() {
    const url = document.getElementById('youtubeUrl').value;
    const videoId = extractYoutubeId(url);
    if (videoId) {
        document.getElementById('youtubePlayer').src = `https://www.youtube.com/embed/${videoId}`;
    } else {
        alert('올바른 유튜브 URL을 입력해주세요.');
    }
}

function extractYoutubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
} 