package exercise2;

import java.util.ArrayList;
import java.util.List;

// Concrete Subject - task trong dự án phần mềm
public class ProjectTask implements Subject {
    private final String taskId;
    private String title;
    private String status; // TODO, IN_PROGRESS, REVIEW, DONE
    private String assignee;
    private final List<Observer> observers = new ArrayList<>();

    public ProjectTask(String taskId, String title) {
        this.taskId = taskId;
        this.title = title;
        this.status = "TODO";
    }

    @Override
    public void subscribe(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void unsubscribe(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers(String event, String message) {
        for (Observer o : observers) {
            o.update(event, message);
        }
    }

    public void updateStatus(String newStatus) {
        String old = this.status;
        this.status = newStatus;
        String msg = String.format("[%s] '%s': %s -> %s", taskId, title, old, newStatus);
        System.out.println("\n[Task] Cập nhật: " + msg);
        notifyObservers("STATUS_CHANGE", msg);
    }

    public void assign(String member) {
        this.assignee = member;
        String msg = String.format("[%s] '%s' được giao cho %s", taskId, title, member);
        System.out.println("\n[Task] Phân công: " + msg);
        notifyObservers("ASSIGNED", msg);
    }

    public String getTaskId() { return taskId; }
    public String getStatus() { return status; }
}
